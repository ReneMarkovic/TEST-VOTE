#!/usr/bin/env python3
"""Prenos in preverjanje uradnih podatkov DVK (volitve.dvk-rs.si/lv2026) v public/lv2026-data.json.

Brez zunanjih knjižnic (uporablja samo standardno knjižnico Python 3),
zato se v GitHub Actions zažene takoj brez nameščanja dodatnih paketov.

Viri:
- https://volitve.dvk-rs.si/lv2026/data/data.json (udeležba, nastavitve, prestetih_glasov)
- https://volitve.dvk-rs.si/lv2026/data/obcine-press/obcina_slovenska_bistrica.json (župan in OS po VE)
- https://volitve.dvk-rs.si/lv2026/data/liste.json (šifrant kandidatnih list)
"""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PATH = ROOT_DIR / "public" / "lv2026-data.json"

DVK_DATA_URL = "https://volitve.dvk-rs.si/lv2026/data/data.json"
DVK_SB_PRESS_URL = (
    "https://volitve.dvk-rs.si/lv2026/data/obcine-press/obcina_slovenska_bistrica.json"
)
DVK_LISTE_URL = "https://volitve.dvk-rs.si/lv2026/data/liste.json"

MUNICIPALITY_ST = 113
MUNICIPALITY_NAME = "SLOVENSKA BISTRICA"

MAYOR_TEMPLATES = [
    {"id": "zagar", "name": "dr. Ivan Žagar", "matchers": ["žagar", "zagar"]},
    {"id": "cvahte", "name": "dr. Peter Cvahte", "matchers": ["cvahte"]},
    {"id": "gosnik", "name": "Edita Gošnik", "matchers": ["gošnik", "gosnik"]},
    {"id": "spaninger", "name": "Matej Španinger", "matchers": ["španinger", "spaninger"]},
]

# Vključuje tudi dejansko DVK tipkarsko napako "GIBANJE SVODODA" v obcine-press JSON-u
COUNCIL_LIST_TEMPLATES = [
    {"id": "sls", "matchers": ["slovenska ljudska stranka", "sls"]},
    {"id": "sds", "matchers": ["slovenska demokratska stranka", "sds"]},
    {
        "id": "svoboda",
        "matchers": ["gibanje svoboda", "gibanje svododa", "svoboda", "svododa"],
    },
    {"id": "sd", "matchers": ["socialni demokrati", "sd"]},
    {"id": "nsi-fokus", "matchers": ["nova slovenija", "nsi", "fokus"]},
    {"id": "sg", "matchers": ["stranka generacij", "sg"]},
    {"id": "demokrati", "matchers": ["demokrati"]},
    {"id": "sns", "matchers": ["slovenska nacionalna stranka", "sns"]},
    {"id": "resnica", "matchers": ["resni.ca", "resnica"]},
]


def to_pct(raw: Any) -> float | None:
    if isinstance(raw, bool) or not isinstance(raw, (int, float)) or raw < 0:
        return None
    pct = raw * 100.0 if raw <= 1 else float(raw)
    return round(pct, 2)


def to_int(raw: Any) -> int | None:
    if isinstance(raw, bool) or not isinstance(raw, (int, float)) or raw < 0:
        return None
    return round(raw)


def normalize_time_label(raw_time: Any) -> str | None:
    if not isinstance(raw_time, str):
        return None
    match = re.search(r"(\d{1,2}):(\d{2})", raw_time)
    if not match:
        return None
    return f"{match.group(1).zfill(2)}:{match.group(2)}"


def format_hour_only(iso_string: Any) -> str | None:
    if not isinstance(iso_string, str):
        return None
    match = re.search(r"T(\d{2}):(\d{2})", iso_string)
    return f"{match.group(1)}:{match.group(2)}" if match else None


def format_dvk_datetime(iso_string: Any) -> str | None:
    if not isinstance(iso_string, str) or not iso_string.strip():
        return None
    match = re.match(r"^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})", iso_string)
    if not match:
        return iso_string
    year, month, day, hour, minute = match.groups()
    return f"{int(day)}. {int(month)}. {year} ob {hour}:{minute}"


def format_pct_sl(pct: float | None) -> str:
    if pct is None:
        return "—"
    return f"{pct:.2f}".replace(".", ",") + " %"


def fetch_json(url: str) -> Any:
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "TEST-VOTE-DVK-Python-Sync/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        if resp.status != 200:
            raise RuntimeError(f"HTTP {resp.status} pri prenosu {url}")
        return json.loads(resp.read().decode("utf-8"))


def read_existing_output() -> dict[str, Any] | None:
    try:
        return json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def resolve_checkpoint_target(nastavitve: dict[str, Any]) -> str | None:
    cas = normalize_time_label(nastavitve.get("cas_udelezba"))
    if cas in {"11:00", "16:00", "19:00"}:
        return cas
    hour_str = format_hour_only(nastavitve.get("datum"))
    if hour_str:
        hour = int(hour_str.split(":")[0])
        if hour <= 13:
            return "11:00"
        if hour <= 18:
            return "16:00"
        return "19:00"
    return None


def resolve_turnout_entry(
    sb_udel: dict[str, Any] | None,
    si_udel: dict[str, Any] | None,
    press_udel: dict[str, Any] | None,
    existing_cp: dict[str, Any] | None,
) -> dict[str, Any]:
    sb_udel = sb_udel if isinstance(sb_udel, dict) else {}
    si_udel = si_udel if isinstance(si_udel, dict) else {}
    press_udel = press_udel if isinstance(press_udel, dict) else {}
    existing_cp = existing_cp if isinstance(existing_cp, dict) else {}

    sb_pct = to_pct(sb_udel.get("prc") if sb_udel.get("prc") is not None else press_udel.get("prc"))
    si_pct = to_pct(si_udel.get("prc"))
    voters = to_int(sb_udel.get("gl") if sb_udel.get("gl") is not None else press_udel.get("glas"))
    eligible = to_int(
        sb_udel.get("upr") if sb_udel.get("upr") is not None else press_udel.get("st_upr")
    )
    cert = to_int(sb_udel.get("gl_pot"))

    return {
        "municipalityPct": sb_pct if sb_pct is not None else existing_cp.get("municipalityPct"),
        "pragerskoPct": existing_cp.get("pragerskoPct"),
        "sloveniaPct": si_pct if si_pct is not None else existing_cp.get("sloveniaPct"),
        "municipalityVoters": (
            voters if voters is not None else existing_cp.get("municipalityVoters")
        ),
        "municipalityEligible": (
            eligible if eligible is not None else existing_cp.get("municipalityEligible")
        ),
        "certificatesCount": (
            cert if cert is not None else existing_cp.get("certificatesCount")
        ),
    }


def collect_objects(root: Any, keys: list[str]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    if isinstance(root, list):
        items.extend(x for x in root if isinstance(x, dict))
    elif isinstance(root, dict):
        for key in keys:
            val = root.get(key)
            if isinstance(val, list):
                items.extend(x for x in val if isinstance(x, dict))
    return items


def extract_mayoral_candidates(
    sb: dict[str, Any], press: dict[str, Any] | None, has_results: bool
) -> list[dict[str, Any]]:
    if not has_results:
        return [{"id": t["id"], "name": t["name"], "votes": None} for t in MAYOR_TEMPLATES]

    raw_list = (
        collect_objects(
            press.get("rez") if press else None,
            ["rez_zup", "kand", "kandidati", "zupan", "zupani", "rezultati"],
        )
        + collect_objects(
            sb.get("kand_rez"),
            ["rez_zup", "kand", "kandidati", "zupan", "zupani", "rezultati"],
        )
        + collect_objects(
            sb.get("rez"),
            ["rez_zup", "kand", "kandidati", "zupan", "zupani"],
        )
    )

    output = []
    for template in MAYOR_TEMPLATES:
        matched = None
        for item in raw_list:
            label = str(
                item.get("naz")
                or item.get("ime")
                or item.get("naziv")
                or item.get("kandidat")
                or item.get("priimek")
                or ""
            ).lower()
            if any(m in label for m in template["matchers"]):
                matched = item
                break

        votes = None
        if matched is not None:
            for field in ("gl", "glas", "glasovi", "st_gl"):
                votes = to_int(matched.get(field))
                if votes is not None:
                    break

        output.append({"id": template["id"], "name": template["name"], "votes": votes})
    return output


def match_list_template_id(
    item: dict[str, Any], liste_map: dict[str, dict[str, Any]]
) -> str | None:
    st_key = str(item["st"]) if item.get("st") is not None else ""
    dict_entry = liste_map.get(st_key, {})
    label = " ".join(
        str(x)
        for x in (
            item.get("naz"),
            item.get("naziv"),
            item.get("kratica"),
            item.get("knaz"),
            dict_entry.get("naz"),
            dict_entry.get("knaz"),
        )
        if x
    ).lower()

    for template in COUNCIL_LIST_TEMPLATES:
        if any(m in label for m in template["matchers"]):
            return template["id"]
    return None


def extract_council_lists(
    sb: dict[str, Any],
    press: dict[str, Any] | None,
    liste_map: dict[str, dict[str, Any]],
    has_results: bool,
) -> list[dict[str, Any]]:
    def empty_votes() -> dict[str, int | None]:
        return {"ve1": None, "ve2": None, "ve3": None, "ve4": None}

    if not has_results:
        return [
            {
                "id": t["id"],
                "votesByUnit": empty_votes(),
                "dvkTotalVotes": None,
                "knownSeatsOverride": None,
            }
            for t in COUNCIL_LIST_TEMPLATES
        ]

    raw_svet = collect_objects(
        press.get("rez") if press else None,
        ["rez_svet", "liste", "svet", "obcinski_svet", "stranke"],
    ) + collect_objects(
        sb.get("rez"), ["rez_svet", "liste", "svet", "obcinski_svet", "stranke"]
    )

    by_id: dict[str, dict[str, Any]] = {
        t["id"]: {
            "votesByUnit": empty_votes(),
            "dvkTotalVotes": 0,
            "hasAnyUnitVotes": False,
        }
        for t in COUNCIL_LIST_TEMPLATES
    }

    for item in raw_svet:
        list_id = match_list_template_id(item, liste_map)
        if not list_id or list_id not in by_id:
            continue
        target = by_id[list_id]

        ve_num = to_int(item.get("ve"))
        votes = None
        for field in ("gl", "glas", "glasovi"):
            votes = to_int(item.get(field))
            if votes is not None:
                break

        if ve_num is not None and 1 <= ve_num <= 4 and votes is not None:
            target["votesByUnit"][f"ve{ve_num}"] = votes
            target["dvkTotalVotes"] += votes
            target["hasAnyUnitVotes"] = True
        elif votes is not None and not target["hasAnyUnitVotes"]:
            target["dvkTotalVotes"] += votes
            target["hasAnyUnitVotes"] = True

    return [
        {
            "id": t["id"],
            "votesByUnit": by_id[t["id"]]["votesByUnit"],
            "dvkTotalVotes": (
                by_id[t["id"]]["dvkTotalVotes"]
                if by_id[t["id"]]["hasAnyUnitVotes"]
                else None
            ),
            "knownSeatsOverride": None,
        }
        for t in COUNCIL_LIST_TEMPLATES
    ]


def extract_invalid_ballots(sb: dict[str, Any], press: dict[str, Any] | None) -> int | None:
    for src in (press.get("rez") if press else None, sb.get("rez")):
        if isinstance(src, dict):
            for field in ("nev", "neveljavni", "neveljavne"):
                val = to_int(src.get(field))
                if val is not None:
                    return val
    return None


def extract_counted_ballots(sb: dict[str, Any], press: dict[str, Any] | None) -> int:
    for src in (press.get("rez") if press else None, sb.get("rez")):
        if isinstance(src, dict):
            for field in ("gl", "glas", "glasovi"):
                val = to_int(src.get(field))
                if val is not None:
                    return val
    return 0


def main() -> int:
    print(f"Prenašam uradne podatke DVK z {DVK_DATA_URL} ...")
    data_json = fetch_json(DVK_DATA_URL)

    press_json: dict[str, Any] | None = None
    try:
        press_json = fetch_json(DVK_SB_PRESS_URL)
    except (urllib.error.URLError, TimeoutError, RuntimeError, json.JSONDecodeError) as err:
        print(f"Opozorilo: press endpoint ni dosegljiv ({err}).", file=sys.stderr)

    liste_json: list[dict[str, Any]] = []
    try:
        loaded_liste = fetch_json(DVK_LISTE_URL)
        if isinstance(loaded_liste, list):
            liste_json = loaded_liste
    except (urllib.error.URLError, TimeoutError, RuntimeError, json.JSONDecodeError):
        pass

    existing = read_existing_output()

    nastavitve = data_json.get("nastavitve")
    slovenija = data_json.get("slovenija")
    obcine = slovenija.get("obcine") if isinstance(slovenija, dict) else None

    if not isinstance(nastavitve, dict) or not isinstance(slovenija, dict) or not isinstance(obcine, list):
        raise RuntimeError(
            "Neveljavna struktura DVK data.json (manjka nastavitve ali slovenija.obcine)."
        )

    sb = next(
        (
            o
            for o in obcine
            if isinstance(o, dict)
            and (
                o.get("st") == MUNICIPALITY_ST
                or str(o.get("naz") or "").strip().upper() == MUNICIPALITY_NAME
            )
        ),
        None,
    )
    if sb is None:
        raise RuntimeError("Občina Slovenska Bistrica (st: 113) ni najdena v DVK data.json.")

    liste_map = {
        str(entry["st"]): entry
        for entry in liste_json
        if isinstance(entry, dict) and entry.get("st") is not None
    }

    cas_udelezba = resolve_checkpoint_target(nastavitve)
    existing_by_time: dict[str, dict[str, Any]] = {}
    if existing and isinstance(existing.get("turnout"), list):
        for cp in existing["turnout"]:
            if isinstance(cp, dict) and isinstance(cp.get("time"), str):
                existing_by_time[cp["time"]] = cp

    cp11_sb = sb.get("udel_11") or (sb.get("udel") if cas_udelezba == "11:00" else None)
    cp11_si = slovenija.get("udel_11") or (
        slovenija.get("udel") if cas_udelezba == "11:00" else None
    )

    cp16_sb = sb.get("udel_16") or (sb.get("udel") if cas_udelezba == "16:00" else None)
    cp16_si = slovenija.get("udel_16") or (
        slovenija.get("udel") if cas_udelezba == "16:00" else None
    )
    cp16_press = press_json.get("udel") if press_json and cas_udelezba == "16:00" else None

    cp19_sb = sb.get("udel_19") or (sb.get("udel") if cas_udelezba == "19:00" else None)
    cp19_si = slovenija.get("udel_19") or (
        slovenija.get("udel") if cas_udelezba == "19:00" else None
    )
    cp19_press = press_json.get("udel") if press_json and cas_udelezba == "19:00" else None

    turnout = [
        {
            "label": "Udeležba ob 11:00",
            "time": "11:00",
            **resolve_turnout_entry(
                cp11_sb,
                cp11_si,
                press_json.get("udel") if press_json and cas_udelezba == "11:00" else None,
                existing_by_time.get("11:00"),
            ),
        },
        {
            "label": "Udeležba ob 16:00",
            "time": "16:00",
            **resolve_turnout_entry(
                cp16_sb,
                cp16_si,
                cp16_press,
                existing_by_time.get("16:00"),
            ),
        },
        {
            "label": "Končna udeležba ob 19:00",
            "time": "19:00",
            **resolve_turnout_entry(
                cp19_sb,
                cp19_si,
                cp19_press,
                existing_by_time.get("19:00"),
            ),
        },
    ]

    has_result_flag = bool(nastavitve.get("has_rezultat"))
    has_actual_result_data = (
        sb.get("rez") is not None
        or sb.get("kand_rez") is not None
        or (press_json is not None and press_json.get("rez") is not None)
    )
    has_results = has_result_flag and has_actual_result_data
    is_final = bool(nastavitve.get("is_final"))

    stage = "v_teku" if not has_results else ("koncni" if is_final else "delni")

    latest_turnout = next(
        (t for t in reversed(turnout) if t.get("municipalityPct") is not None),
        turnout[0],
    )

    datum_or_press = nastavitve.get("datum") or (press_json.get("datum") if press_json else None)
    dvk_clock = format_hour_only(datum_or_press) or format_hour_only(nastavitve.get("timestamp"))
    dvk_formatted_date = format_dvk_datetime(datum_or_press or nastavitve.get("timestamp"))

    dvk_counted_pct = to_pct(sb.get("prestetih_glasov"))
    dvk_votes_counted = extract_counted_ballots(sb, press_json)

    if has_results:
        prefix = "Končni" if is_final else "Delni"
        pct_part = f"preštetih {format_pct_sl(dvk_counted_pct)} · " if dvk_counted_pct is not None else ""
        clock_part = f" · osveženo {dvk_clock}" if dvk_clock else ""
        last_updated_label = f"{prefix} izidi DVK ({pct_part}{dvk_votes_counted} glasov{clock_part})"
    else:
        t_label = latest_turnout.get("time") or cas_udelezba or "16:00"
        clock_part = f" (osveženo DVK {dvk_clock})" if dvk_clock else ""
        last_updated_label = (
            f"Udeležba ob {t_label}: SB {format_pct_sl(latest_turnout.get('municipalityPct'))}"
            f" · SI {format_pct_sl(latest_turnout.get('sloveniaPct'))}{clock_part}"
        )

    sb_udel = sb.get("udel") if isinstance(sb.get("udel"), dict) else {}
    press_udel = press_json.get("udel") if press_json and isinstance(press_json.get("udel"), dict) else {}
    eligible_voters = (
        to_int(sb_udel.get("upr") if sb_udel.get("upr") is not None else press_udel.get("st_upr"))
        or latest_turnout.get("municipalityEligible")
        or (existing.get("eligibleVotersMunicipality") if existing else None)
        or 20336
    )

    mayoral_candidates = extract_mayoral_candidates(sb, press_json, has_results)
    council_lists = extract_council_lists(sb, press_json, liste_map, has_results)
    invalid_ballots_mayor = extract_invalid_ballots(sb, press_json)

    output = {
        "year": 2026,
        "dateLabel": "15. november 2026",
        "stage": stage,
        "hasResults": has_results,
        "casUdelezba": cas_udelezba,
        "dvkUpdatedAt": dvk_formatted_date or nastavitve.get("datum"),
        "dvkVotesCounted": dvk_votes_counted,
        "dvkCountedPct": dvk_counted_pct,
        "invalidBallotsMayor": invalid_ballots_mayor,
        "lastUpdatedLabel": last_updated_label,
        "eligibleVotersMunicipality": eligible_voters,
        "turnout": turnout,
        "mayoralCandidates": mayoral_candidates,
        "councilLists": council_lists,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(
        f"Uspešno posodobljeno public/lv2026-data.json | "
        f"cas_udelezba={output['casUdelezba']} | "
        f"SB={latest_turnout.get('municipalityPct')}% "
        f"({latest_turnout.get('municipalityVoters')}/{latest_turnout.get('municipalityEligible')}) | "
        f"SI={latest_turnout.get('sloveniaPct')}% | "
        f"has_rezultat={output['hasResults']} | "
        f"counted={dvk_votes_counted} ({dvk_counted_pct}%)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
