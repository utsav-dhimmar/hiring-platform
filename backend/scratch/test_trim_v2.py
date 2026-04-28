import re
from typing import TypedDict

class DialogueTurn(TypedDict):
    speaker: str
    text: str

def trim_post_interview_noise(dialogues: list[DialogueTurn]) -> list[DialogueTurn]:
    if not dialogues or len(dialogues) < 5:
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
        if any(re.search(pattern, text) for pattern in closing_patterns):
            remaining_turns = dialogues[i+1:]
            if not remaining_turns:
                continue 
                
            is_noise = True
            for r in remaining_turns:
                words = r["text"].split()
                if len(words) > 30: # Much higher limit
                    is_noise = False
                    break
                if len(words) > 10:
                    avg_len = sum(len(w) for w in words) / len(words)
                    if avg_len < 3.5: # Likely gibberish
                        continue
            
            if is_noise:
                potential_end_index = i
    
    if potential_end_index != -1:
        return dialogues[:potential_end_index + 1]
        
    return dialogues

test_dialogues = [
    {"speaker": "Interviewer", "text": "Thank you for your time. Yes, dropping from. . Thank you."},
    {"speaker": "Candidate", "text": "Thank you. Bye."},
    {"speaker": "Interviewer", "text": "Thank you, Rudy. Thank you for your time. Thank you all. ."},
    {"speaker": "Noise1", "text": "Manavi, , , Wordsworth."},
    {"speaker": "Noise2", "text": "Yes, yes. Hey. No."},
    {"speaker": "Noise3", "text": "Takes it out. Our help, sorry."},
    {"speaker": "Noise4", "text": "Done. Sure. . Oh, I was. I was a wedding known as season."},
    {"speaker": "Noise5", "text": "Saturday, Sunday."},
    {"speaker": "Noise6", "text": "Oh, oh, mix. Oh. Oh. Oh. huh."},
    {"speaker": "Noise7", "text": "Exactly. Thirty. Exactly."},
    {"speaker": "Noise8", "text": "39 exactly. Mm. Girl, my line lagi my fella Mumine, but he daughter name, but he wife name."},
    {"speaker": "Noise9", "text": "What? Oh. Oh, but then it."},
    {"speaker": "Noise10", "text": "We don't get one more. I break. I saw in it. That's me. Por spuro karo na mijukai ni utlo marta bhag."}
]

# Add some fake interview turns at the start to pass the 5 turn limit
prefix = [{"speaker": "A", "text": "Question " + str(i)} for i in range(10)]
full_test = prefix + test_dialogues

result = trim_post_interview_noise(full_test)
print(f"Original count: {len(full_test)}")
print(f"Trimmed count: {len(result)}")
print(f"Last line: {result[-1]['text']}")
