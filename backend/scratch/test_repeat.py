import re

def remove_repetitions(text: str) -> str:
    return re.sub(r'\b(\w+)(?:[\s,.]+\1\b)+', r'\1', text, flags=re.IGNORECASE)

test_text = "yes, same, same. , same a here same"
result = remove_repetitions(test_text)
print(f"Original: {test_text}")
print(f"Result:   {result}")
