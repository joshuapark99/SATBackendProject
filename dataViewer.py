import pandas as pd

data = pd.read_json('./public/math_questions.jsonl', lines=True)

print(data['question_rationale'].head())