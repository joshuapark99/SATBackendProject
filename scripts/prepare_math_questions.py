import argparse
import json
import os
import sys
import re
import pandas as pd


def normalize_difficulty(value: str) -> str:
    if not value:
        return "medium"
    v = str(value).lower()
    if "easy" in v:
        return "easy"
    if "medium" in v:
        return "medium"
    if "hard" in v:
        return "hard"
    return "medium"


def map_attributes(arr):
    if not isinstance(arr, list):
        return ["SAT", "Math", "Unknown", "Unknown"]
    copied = list(arr)
    if len(copied) > 0:
        copied.pop()  # drop last element
    while len(copied) < 4:
        copied.append("Unknown")
    return copied[:4]


def derive_answer_and_type(rationale: str):
    text = str(rationale or "")
    if text.startswith("Rationale\nChoice"):
        m = re.match(r"^Rationale\nChoice\s+([A-Da-d])\b", text)
        if m:
            return True, m.group(1).upper()
    marker = "Rationale\nThe correct answer is\n"
    idx = text.find(marker)
    if idx != -1:
        rest = text[idx + len(marker):]
        m = re.match(r"([^\n\r\.]*)", rest)
        if m:
            val = m.group(1).strip()
            if val:
                return False, val
    return False, ""


def extract_short_id(raw_id: str) -> str:
    """Return an 8-character alphanumeric identifier from the raw question_id string.
    Examples:
    - 'Question ID: 3f5a3602' -> '3f5a3602'
    - '3f5a3602' -> '3f5a3602'
    - 'ID ABCD1234' -> 'ABCD1234'
    """
    s = str(raw_id or "").strip()
    # Look for 8-character alphanumeric sequences
    m = re.findall(r"[A-Za-z0-9]{8}", s)
    if m:
        return m[-1]  # Return the last 8-character sequence found
    # Fallback: find any alphanumeric sequence and take last 8 characters
    m = re.findall(r"[A-Za-z0-9]+", s)
    if m:
        last_sequence = m[-1]
        if len(last_sequence) >= 8:
            return last_sequence[-8:]
        return last_sequence
    return s  # as-is if nothing found


def extract_question_content(question_content: str) -> str:
    """Extract the literal HTML content from question_content field.
    
    Simply return the question_content as-is without any formatting or parsing.
    """
    return str(question_content or "")


def main():
    parser = argparse.ArgumentParser(description="Prepare math_questions JSONL to simpler schema (pandas)")
    parser.add_argument("--input", default=os.path.join("public", "math_questions.jsonl"))
    parser.add_argument("--output", default=os.path.join("public", "math_questions_prepared.jsonl"))
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--id")
    parser.add_argument("--index", type=int)
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"Input not found: {args.input}")
        sys.exit(1)

    try:
        df = pd.read_json(args.input, lines=True, dtype=False)
    except ValueError as e:
        print(f"Failed to read JSONL with pandas: {e}")
        sys.exit(1)

    # Optional filters
    if args.index is not None:
        # 1-based index in file order
        if args.index <= 0 or args.index > len(df):
            print("No matching record found for the given index.")
            sys.exit(2)
        df = df.iloc[[args.index - 1]]

    if args.id is not None:
        df = df[df.get("question_id").astype(str) == args.id]
        if df.empty:
            print("No matching record found for the given id.")
            sys.exit(2)

    if args.limit and len(df) > args.limit:
        df = df.head(args.limit)

    # Build output columns
    df_out = pd.DataFrame()
    df_out["id"] = df.get("question_id").apply(extract_short_id)
    df_out["attributes"] = df.get("question_attribute").apply(map_attributes)
    df_out["difficulty"] = df.get("difficulty").apply(normalize_difficulty)

    # Extract literal HTML content from question_content field
    question_content = df.get("question_content", pd.Series([""] * len(df)))
    df_out["prompt"] = question_content.apply(extract_question_content)

    df_out["rationale"] = df.get("question_rationale").fillna("")

    # derive MC and correct answer
    derived = df_out["rationale"].apply(derive_answer_and_type)
    df_out["is_multiple_choice"] = derived.apply(lambda x: x[0])
    df_out["correct_answer"] = derived.apply(lambda x: x[1])

    # copy raw choices HTML
    df_out["choices_raw"] = df.get("question_choices").fillna("").astype(str)

    # Validate ids
    missing_ids = df_out["id"].eq("").sum()
    if missing_ids:
        print(f"Warning: {missing_ids} record(s) missing id; they will still be written as-is.")

    # Write out
    try:
        df_out.to_json(args.output, orient="records", lines=True, force_ascii=False)
    except Exception as e:
        print(f"Failed to write output: {e}")
        sys.exit(1)

    print(f"Prepared {len(df_out)} record(s). Output: {args.output}")


if __name__ == "__main__":
    main()
