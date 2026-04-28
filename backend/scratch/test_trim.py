import re
from typing import TypedDict

class DialogueTurn(TypedDict):
    speaker: str
    text: str

def trim_post_interview_noise(dialogues: list[DialogueTurn]) -> list[DialogueTurn]:
    if not dialogues or len(dialogues) < 3: # Lowered for test
        return dialogues
    
    lookback_limit = max(len(dialogues) // 5, 30)
    start_index = max(0, len(dialogues) - lookback_limit)
    
    closing_patterns = [
        r"\bthank\s+you\b",
        r"\bbye\b",
        r"\bgoodbye\b",
        r"\bdropping\s+off\b",
        r"\bhave\s+a\s+great\s+day\b",
        r"\bsee\s+you\b",
        r"\btake\s+care\b"
    ]
    
    potential_end_index = -1
    
    for i in range(len(dialogues) - 1, start_index - 1, -1):
        text = dialogues[i]["text"].lower()
        print(f"Checking turn {i}: {text}")
        if any(re.search(pattern, text) for pattern in closing_patterns):
            print(f"  Found closing at {i}")
            remaining_turns = dialogues[i+1:]
            if not remaining_turns:
                continue 
                
            is_noise = True
            for r in remaining_turns:
                words = r["text"].split()
                print(f"    Next turn {r['text']} has {len(words)} words")
                if len(words) > 15:
                    is_noise = False
                    break
            
            if is_noise:
                potential_end_index = i
                print(f"    Setting potential_end_index to {i}")
    
    if potential_end_index != -1:
        return dialogues[:potential_end_index + 1]
        
    return dialogues

test_dialogues = [
    {"speaker": "S1", "text": "Hello."},
    {"speaker": "S2", "text": "Hi."},
    {"speaker": "S1", "text": "Thank you for your time. Bye."},
    {"speaker": "S2", "text": "Thank you. Bye."},
    {"speaker": "S1", "text": "Hey did you see that game yesterday?"},
    {"speaker": "S2", "text": "it was crazy."}
]

result = trim_post_interview_noise(test_dialogues)
print(f"\nFinal count: {len(result)}")
for d in result:
    print(f"{d['speaker']}: {d['text']}")
