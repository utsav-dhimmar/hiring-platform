import logging
import openai
import json
from app.v1.core.config import settings

logger = logging.getLogger(__name__)

class PromptEnhancerService:
    """Service to enhance rough user prompts using the exact OpenAI client pattern used elsewhere."""
    
    def __init__(self):
        # Using the exact same initialization pattern as EvaluationAgent
        # Note: If OLLAMA_URL has a trailing slash, this becomes ...//v1
        # but the OpenAI client handles double slashes gracefully.
        self.client = openai.AsyncOpenAI(
            base_url=settings.OLLAMA_URL + "v1",
            api_key=settings.OLLAMA_API_KEY or "ollama"
        )

    async def enhance_prompt(self, name: str, rough_description: str) -> str:
        """
        Enhances the prompt using the same OpenAI client pattern used in evaluation/agent.py.
        """
        system_prompt = "You are an expert HR and Technical Interviewer."
        user_prompt = f"""
        Generate a professional evaluation rubric for the following hiring criterion:
        
        Name: {name}
        Initial Description: {rough_description}

        Format Requirements:
        1. Start with exactly: "Evaluate the candidate's {name.lower()}."
        2. Add a section: "Consider: [3-4 key technical or behavioral points to check]"
        3. Provide a section: "Scoring rubric:"
        - 1: [Specific behavior for very poor performance]
        - 2: [Specific behavior for below average]
        - 3: [Specific behavior for acceptable/meets expectations]
        - 4: [Specific behavior for strong/above average]
        - 5: [Specific behavior for exceptional mastery]

        Return ONLY the formatted text.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=settings.OLLAMA_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            if content and len(content.strip()) > 50:
                return content.strip()

            raise ValueError("Empty or invalid response from AI")

        except Exception as e:
            logger.error(f"Prompt Enhancement via OpenAI client failed: {e}")
            # Fallback
            return (
                f"Evaluate the candidate's {name.lower()}.\n"
                f"Consider: {rough_description}\n"
                f"Scoring rubric:\n"
                f"- 1: Very poor / No relevant skills shown\n"
                f"- 2: Below average / Significant weaknesses\n"
                f"- 3: Acceptable / Meets minimum requirements\n"
                f"- 4: Strong / Above average performance\n"
                f"- 5: Exceptional / Outstanding mastery"
            )

# Singleton instance
prompt_enhancer_service = PromptEnhancerService()
