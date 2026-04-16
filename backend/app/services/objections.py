"""
Dynamic personality generation and objection bank for role-play sessions.

Instead of fixed personalities, the system generates a unique mystery customer
each session. The rep doesn't know the customer's hidden traits -- they have
to read the person and adapt. Post-session grading evaluates how well they
identified and handled the hidden issues.
"""

import random

# --- Objection Bank ---

OBJECTIONS = [
    # Easy
    {"text": "I need to talk to my spouse first.", "tier": "easy", "skill": "empathy"},
    {"text": "We're thinking about moving soon.", "tier": "easy", "skill": "objection_handling"},
    {"text": "My electricity bill isn't that high.", "tier": "easy", "skill": "value_selling"},
    {"text": "What happens when it's cloudy or at night?", "tier": "easy", "skill": "product_knowledge"},
    # Medium
    {"text": "I heard solar panels ruin your roof.", "tier": "medium", "skill": "product_knowledge"},
    {"text": "I don't trust solar companies.", "tier": "medium", "skill": "trust_building"},
    {"text": "We already got a quote and it was too expensive.", "tier": "medium", "skill": "value_selling"},
    {"text": "I'm locked into a contract with my utility.", "tier": "medium", "skill": "objection_handling"},
    {"text": "I'm worried about maintenance costs.", "tier": "medium", "skill": "product_knowledge"},
    {"text": "We're only renting this place.", "tier": "medium", "skill": "qualifying"},
    # Hard
    {"text": "The technology keeps getting better, I'll wait.", "tier": "hard", "skill": "urgency"},
    {"text": "I'm filing for bankruptcy and have bad credit.", "tier": "hard", "skill": "qualifying"},
    {"text": "My HOA won't allow it.", "tier": "hard", "skill": "objection_handling"},
    {"text": "I've read about solar panels catching fire.", "tier": "hard", "skill": "trust_building"},
    {"text": "I just want the free quote, I'm not buying today.", "tier": "hard", "skill": "closing"},
]

# --- Personality Building Blocks (mixed and matched randomly) ---

NAMES = [
    "Mike", "Sarah", "Dave", "Linda", "James", "Maria", "Tom", "Karen",
    "Chris", "Angela", "Robert", "Diane", "Kevin", "Patricia", "Brian",
    "Susan", "Mark", "Jennifer", "Scott", "Lisa",
]

SPEAKING_STYLES = [
    "speaks in short, clipped sentences",
    "rambles and goes on tangents",
    "very polite but evasive",
    "blunt and direct",
    "quiet and gives one-word answers at first",
    "talks fast and interrupts",
    "warm and chatty but dodges commitment",
    "formal and business-like",
    "casual and laid-back",
    "nervous and asks lots of questions",
]

HIDDEN_TRAITS = [
    {"trait": "recently_scammed", "description": "Was scammed by a home improvement company 6 months ago. Deeply distrustful but won't bring it up unless they feel safe.", "hint": "mentions 'bad experience' or gets defensive about contracts"},
    {"trait": "spouse_controls_finances", "description": "Their spouse handles all financial decisions and will be angry if they agree to anything alone.", "hint": "hesitates when money comes up, mentions needing to 'check with someone'"},
    {"trait": "secretly_interested", "description": "Actually very interested in solar but playing hard to get because a neighbor told them to negotiate hard.", "hint": "asks detailed questions despite acting uninterested"},
    {"trait": "financial_stress", "description": "Dealing with serious financial problems but embarrassed to admit it.", "hint": "reacts strongly to costs, changes subject when payments come up"},
    {"trait": "environmental_passion", "description": "Deeply cares about the environment but is skeptical of companies using green claims to profit.", "hint": "responds to environmental arguments but pushes back on corporate motives"},
    {"trait": "analysis_paralysis", "description": "Has researched solar extensively but can't make a decision. Has 4 quotes already.", "hint": "knows technical details, mentions other companies, keeps comparing"},
    {"trait": "lonely_wants_to_talk", "description": "Lives alone and is lonely. Keeps the conversation going because they enjoy the company, not because they're buying.", "hint": "asks personal questions, goes off-topic, seems in no hurry"},
    {"trait": "bad_roof", "description": "Knows their roof needs replacement first but doesn't want to spend that money.", "hint": "deflects questions about roof age/condition, changes subject"},
    {"trait": "moving_soon", "description": "Planning to sell the house in 6 months but curious if solar increases home value.", "hint": "asks about resale value, mentions timeline concerns"},
    {"trait": "competitor_loyalty", "description": "Their brother-in-law works for a competing solar company and they feel obligated to use them.", "hint": "mentions 'someone they know' in the industry, compares unfavorably"},
]

EMOTIONAL_STATES = [
    "stressed and short on time",
    "relaxed and open to chatting",
    "irritated (just had a bad day)",
    "cautiously optimistic",
    "deeply skeptical",
    "friendly but guarded",
    "impatient and wants facts only",
    "curious but non-committal",
]

DIFFICULTY_CONFIG = {
    "easy": {
        "objection_count": 2,
        "tiers": ["easy"],
        "hidden_trait_count": 1,
        "pushback": "light",
        "reveal_hints": True,
    },
    "medium": {
        "objection_count": 3,
        "tiers": ["easy", "medium"],
        "hidden_trait_count": 2,
        "pushback": "moderate",
        "reveal_hints": False,
    },
    "hard": {
        "objection_count": 5,
        "tiers": ["easy", "medium", "hard"],
        "hidden_trait_count": 3,
        "pushback": "aggressive",
        "reveal_hints": False,
    },
}


def generate_personality(difficulty: str) -> dict:
    """Generate a unique random personality for this session."""
    config = DIFFICULTY_CONFIG.get(difficulty, DIFFICULTY_CONFIG["medium"])

    name = random.choice(NAMES)
    style = random.choice(SPEAKING_STYLES)
    mood = random.choice(EMOTIONAL_STATES)

    # Pick hidden traits
    traits = random.sample(HIDDEN_TRAITS, config["hidden_trait_count"])

    # Pick objections
    eligible = [o for o in OBJECTIONS if o["tier"] in config["tiers"]]
    objections = random.sample(eligible, min(config["objection_count"], len(eligible)))

    return {
        "name": name,
        "speaking_style": style,
        "emotional_state": mood,
        "hidden_traits": traits,
        "objections": objections,
        "difficulty": difficulty,
        "config": config,
    }


def build_system_prompt(personality: dict) -> str:
    """Build the system prompt for a generated personality."""
    p = personality
    config = p["config"]

    objection_list = "\n".join(f"- {o['text']}" for o in p["objections"])
    trait_descriptions = "\n".join(
        f"- {t['trait'].upper()}: {t['description']}" for t in p["hidden_traits"]
    )
    trait_hints = "\n".join(
        f"- {t['trait']}: {t['hint']}" for t in p["hidden_traits"]
    )

    return f"""You are role-playing as a homeowner named {p['name']} who is being approached by a solar panel salesperson (the user). You are NOT an AI assistant -- you ARE this character completely.

CHARACTER:
- Name: {p['name']}
- Speaking style: {p['speaking_style']}
- Current mood: {p['emotional_state']}

HIDDEN TRAITS (these are secrets the salesperson must discover through good conversation):
{trait_descriptions}

How these traits surface (DON'T state them directly -- show them through behavior):
{trait_hints}

OBJECTIONS (use these naturally throughout the conversation):
{objection_list}

DIFFICULTY: {p['difficulty'].upper()} ({config['pushback']} pushback)

CRITICAL RULES:
1. Stay in character 100%. Never break character or acknowledge you're an AI.
2. Start as if the salesperson just knocked on your door.
3. Your hidden traits should LEAK through your behavior, not be stated outright. If the salesperson picks up on them and addresses them with empathy, warm up. If they bulldoze past the signs, get more resistant.
4. {"Give in relatively easily if they address your concerns well." if p['difficulty'] == "easy" else "Require solid, specific answers before budging. Push back on vague promises." if p['difficulty'] == "medium" else "Be very resistant. Circle back to objections. Make them really earn it. Only warm up if they genuinely address your hidden concerns."}
5. Keep responses SHORT (1-3 sentences). This is a spoken conversation.
6. If a salesperson shows genuine empathy about your hidden trait, that should be a turning point -- reward them by opening up slightly.
7. If they use high-pressure tactics or ignore your emotional cues, shut down.
8. After 10-15 exchanges: agree to next steps if they've done well, or politely end the conversation if they haven't.

IMPORTANT: Every response must be under 50 words. Natural, spoken dialogue only."""


def get_grading_context(personality: dict) -> dict:
    """Return the info needed to grade a session after it ends."""
    return {
        "customer_name": personality["name"],
        "difficulty": personality["difficulty"],
        "hidden_traits": [
            {"trait": t["trait"], "description": t["description"], "hint": t["hint"]}
            for t in personality["hidden_traits"]
        ],
        "objections": [
            {"text": o["text"], "skill": o["skill"]}
            for o in personality["objections"]
        ],
        "emotional_state": personality["emotional_state"],
    }
