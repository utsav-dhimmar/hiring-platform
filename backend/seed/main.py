import asyncio
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from seed.seed import main as seed_main
from seed.seed_for_user import main as seed_for_user_main
from seed.seed_frontend_dev import main as seed_frontend_dev_main
from seed.seed_job import main as seed_job_main
from seed.seed_skills import main as seed_skills_main
from seed.seed_stages import main as seed_stages_main

SEED_STEPS = [
    ("seed.py", seed_main),
    ("seed_for_user.py", seed_for_user_main),
    ("seed_skills.py", seed_skills_main),
    ("seed_stages.py", seed_stages_main),
    ("seed_frontend_dev.py", seed_frontend_dev_main),
    ("seed_job.py", seed_job_main),
]


async def main() -> None:
    for name, runner in SEED_STEPS:
        print(f"Running {name}...")
        await runner()

    print("All seed scripts completed successfully.")


def run() -> None:
    asyncio.run(main())


if __name__ == "__main__":
    run()
