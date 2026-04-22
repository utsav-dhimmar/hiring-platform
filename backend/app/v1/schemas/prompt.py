
from pydantic import BaseModel

class PromptRead(BaseModel):
    name: str
    content: str

class PromptsList(BaseModel):
    data: list[PromptRead]
