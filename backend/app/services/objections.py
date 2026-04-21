"""
Dynamic personality generation and objection bank for role-play sessions.
Supports multiple sales scenarios (solar, web services, etc.).
"""

import random

# ============================================================
# SCENARIOS
# ============================================================

SCENARIOS = {
    "solar": {
        "id": "solar",
        "name": "Solar Sales",
        "description": "Door-to-door solar panel sales to homeowners",
        "icon": "sun",
        "role": "homeowner",
        "setting": "A solar panel salesperson (the user) has just knocked on your door and will speak first.",
    },
    "web": {
        "id": "web",
        "name": "Website & WaaS Sales",
        "description": "Selling websites and web-as-a-service to local business owners",
        "icon": "globe",
        "role": "business owner",
        "setting": "A web services salesperson (the user) has just walked into your business and will speak first. You own and run this business. If the salesperson mentions your business name or type, that IS your business -- go with it naturally.",
    },
}

# ============================================================
# OBJECTION BANKS (per scenario)
# ============================================================

OBJECTIONS = {
    "solar": [
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
    ],
    "web": [
        # Easy
        {"text": "We already have a Facebook page, isn't that enough?", "tier": "easy", "skill": "value_selling"},
        {"text": "I'm not very tech-savvy.", "tier": "easy", "skill": "empathy"},
        {"text": "How much does a website cost?", "tier": "easy", "skill": "product_knowledge"},
        {"text": "My nephew built us a website once.", "tier": "easy", "skill": "objection_handling"},
        # Medium
        {"text": "We tried a website before and it didn't bring in any customers.", "tier": "medium", "skill": "trust_building"},
        {"text": "I don't have time to manage a website.", "tier": "medium", "skill": "value_selling"},
        {"text": "What's the difference between your service and Wix or Squarespace?", "tier": "medium", "skill": "product_knowledge"},
        {"text": "We get all our business from word of mouth.", "tier": "medium", "skill": "urgency"},
        {"text": "I'm not sure I can afford a monthly fee right now.", "tier": "medium", "skill": "qualifying"},
        {"text": "Can't I just pay someone on Fiverr to do this?", "tier": "medium", "skill": "value_selling"},
        # Hard
        {"text": "I've been burned by web companies before -- paid thousands and got nothing.", "tier": "hard", "skill": "trust_building"},
        {"text": "My business is seasonal, I don't need a website year-round.", "tier": "hard", "skill": "objection_handling"},
        {"text": "I'm thinking about selling the business actually.", "tier": "hard", "skill": "qualifying"},
        {"text": "What happens to my website if I stop paying you?", "tier": "hard", "skill": "closing"},
        {"text": "Just send me an email with the info, I'll think about it.", "tier": "hard", "skill": "closing"},
    ],
}

# ============================================================
# HIDDEN TRAITS (per scenario)
# ============================================================

HIDDEN_TRAITS = {
    "solar": [
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
    ],
    "web": [
        {"trait": "burned_before", "description": "Paid $5,000 to a web agency two years ago. They disappeared after delivering a broken site. Won't mention it unless trust is built.", "hint": "tenses up around contracts and payments, asks about guarantees"},
        {"trait": "partner_disagrees", "description": "Their business partner thinks a website is a waste of money and will veto any purchase.", "hint": "says 'we' a lot, hesitates on decisions, mentions needing to discuss"},
        {"trait": "secretly_desperate", "description": "Business is struggling badly -- they NEED new customers but are too proud to admit it.", "hint": "deflects questions about how business is going, mentions it's 'fine'"},
        {"trait": "tech_anxiety", "description": "Terrified of technology. Doesn't want to look stupid. Won't admit they don't know basic web terms.", "hint": "nods along without asking questions, avoids technical details"},
        {"trait": "diy_mindset", "description": "Believes they should be able to do everything themselves. Spending money on services feels like failure.", "hint": "asks 'can't I just do this myself?', mentions YouTube tutorials"},
        {"trait": "competitor_obsession", "description": "Their competitor across town just got a beautiful new website and it's eating at them.", "hint": "mentions the competitor, compares themselves, shows jealousy"},
        {"trait": "cash_flow_crisis", "description": "Having serious cash flow problems this quarter. Interested but literally can't commit right now.", "hint": "asks about payment plans, free trials, delays on payments"},
        {"trait": "loyal_to_current_guy", "description": "Has a 'computer guy' who's a family friend. Feels guilty about going elsewhere even though the guy is unreliable.", "hint": "mentions 'someone who helps us with that', makes excuses for poor service"},
        {"trait": "expansion_plans", "description": "Secretly planning to open a second location. Needs a web presence but hasn't told anyone yet.", "hint": "asks about multiple locations, future scaling, mentions growth"},
        {"trait": "bad_reviews", "description": "Has terrible Google reviews and is terrified a website will make them more visible to critics.", "hint": "avoids talking about online presence, dismisses reviews as fake"},
    ],
}

# ============================================================
# SHARED BUILDING BLOCKS
# ============================================================

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
    },
    "medium": {
        "objection_count": 3,
        "tiers": ["easy", "medium"],
        "hidden_trait_count": 2,
        "pushback": "moderate",
    },
    "hard": {
        "objection_count": 5,
        "tiers": ["easy", "medium", "hard"],
        "hidden_trait_count": 3,
        "pushback": "aggressive",
    },
}


def generate_personality(difficulty: str, scenario: str = "solar") -> dict:
    """Generate a unique random personality for this session."""
    config = DIFFICULTY_CONFIG.get(difficulty, DIFFICULTY_CONFIG["medium"])
    scenario_data = SCENARIOS.get(scenario, SCENARIOS["solar"])

    name = random.choice(NAMES)
    style = random.choice(SPEAKING_STYLES)
    mood = random.choice(EMOTIONAL_STATES)

    # Pick hidden traits for this scenario
    trait_pool = HIDDEN_TRAITS.get(scenario, HIDDEN_TRAITS["solar"])
    traits = random.sample(trait_pool, min(config["hidden_trait_count"], len(trait_pool)))

    # Pick objections for this scenario
    objection_pool = OBJECTIONS.get(scenario, OBJECTIONS["solar"])
    eligible = [o for o in objection_pool if o["tier"] in config["tiers"]]
    objections = random.sample(eligible, min(config["objection_count"], len(eligible)))

    return {
        "name": name,
        "speaking_style": style,
        "emotional_state": mood,
        "hidden_traits": traits,
        "objections": objections,
        "difficulty": difficulty,
        "scenario": scenario,
        "scenario_data": scenario_data,
        "config": config,
    }


def build_system_prompt(personality: dict) -> str:
    """Build the system prompt for a generated personality."""
    p = personality
    config = p["config"]
    scenario = p["scenario_data"]

    objection_list = "\n".join(f"- {o['text']}" for o in p["objections"])
    trait_descriptions = "\n".join(
        f"- {t['trait'].upper()}: {t['description']}" for t in p["hidden_traits"]
    )
    trait_hints = "\n".join(
        f"- {t['trait']}: {t['hint']}" for t in p["hidden_traits"]
    )

    return f"""You are role-playing as a {scenario['role']} named {p['name']}. {scenario['setting']} You are NOT an AI assistant -- you ARE this character completely.

CHARACTER:
- Name: {p['name']}
- Role: {scenario['role']}
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
2. NEVER use stage directions, narration, or action descriptions like *opens door*, *sighs*, *looks away*, etc. Only speak direct dialogue -- exactly what you would say out loud. No asterisks, no parentheses, no describing actions.
3. If the salesperson mentions a specific business name or type, that IS your business. Go with it naturally. You own and run it.
4. Your hidden traits should LEAK through your behavior, not be stated outright. If the salesperson picks up on them and addresses them with empathy, warm up. If they bulldoze past the signs, get more resistant.
5. {"Give in relatively easily if they address your concerns well." if p['difficulty'] == "easy" else "Require solid, specific answers before budging. Push back on vague promises." if p['difficulty'] == "medium" else "Be very resistant. Circle back to objections. Make them really earn it. Only warm up if they genuinely address your hidden concerns."}
6. Keep responses SHORT (1-3 sentences). This is a spoken conversation.
7. If a salesperson shows genuine empathy about your hidden trait, that should be a turning point -- reward them by opening up slightly.
8. If they use high-pressure tactics or ignore your emotional cues, shut down.
9. After 10-15 exchanges: agree to next steps if they've done well, or politely end the conversation if they haven't.

IMPORTANT: Every response must be under 50 words. Natural, spoken dialogue only. NEVER narrate actions or use asterisks/parentheses -- only say what you would actually speak out loud."""


def get_grading_context(personality: dict) -> dict:
    """Return the info needed to grade a session after it ends."""
    return {
        "customer_name": personality["name"],
        "difficulty": personality["difficulty"],
        "scenario": personality["scenario"],
        "scenario_name": personality["scenario_data"]["name"],
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
