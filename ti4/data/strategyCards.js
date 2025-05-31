const BASE_STRATEGY_CARDS = [
    {
        name: 'Leadership',
        initiative: 1,
        primaryAbility: [
            'Gain 3 command tokens.',
            'Spend any amount of influence to gain 1 command token for every 3 influence spent.'
        ],
        secondaryAbility: ['Spend any amount of influence to gain 1 command token for every 3 influence spent.']
    },
    {
        name: 'Diplomacy',
        initiative: 2,
        specialAbility: ['After selecting this strategy card, remove Red Tape counters equal to the number of trade goods on this card.'],
        primaryAbility: [
            'Remove 1 Red Tape counter from the public objective of your choice. You may not choose a Stage II objective in the first 3 rounds.', // This is the "Red Tape Variant" part
            'Choose 1 system other than the Mecatol Rex system that contains a planet you control; no other player places a command token in their reinforcements in that system.',
            'Then, ready up to 2 exhausted planets you control.'
        ],
        secondaryAbility: ['Spend 1 token from your strategy pool to ready up to 2 exhausted planets you control.']
    },
    {
        name: 'Politics',
        initiative: 3,
        primaryAbility: [
            'Choose a player other than the speaker. That player gains the speaker token.',
            'Draw 2 action cards.',
            'Look at the top 2 cards of the agenda deck. Place each card on the top or bottom of the deck in any order.'
        ],
        secondaryAbility: ['Spend 1 token from your strategy pool to draw 2 action cards.']
    },
    {
        name: 'Construction',
        initiative: 4,
        primaryAbility: [
            'Place 1 PDS or 1 space dock on a planet you control.',
            'Place 1 PDS on a planet you control.'
        ],
        secondaryAbility: ['Spend 1 token from your strategy pool and place it in any system; you may place either 1 space dock or 1 PDS on a planet you control in that system.']
    },
    {
        name: 'Trade',
        initiative: 5,
        primaryAbility: [
            'Gain 3 trade goods.',
            'Replenish commodities.',
            'Choose any number of other players. Those players use the secondary ability of this strategy card without spending a command token.'
        ],
        secondaryAbility: ['Spend 1 token from your strategy pool to replenish commodities.']
    },
    {
        name: 'Warfare',
        initiative: 6,
        primaryAbility: [
            'Remove 1 of your command tokens from the game board; then, gain 1 command token.',
            'Redistribute any number of the command tokens on your command sheet.'
        ],
        secondaryAbility: ['Spend 1 token from your strategy pool to use the PRODUCTION ability of 1 of your space docks in your home system.']
    },
    {
        name: 'Technology',
        initiative: 7,
        primaryAbility: [
            'Research 1 technology.',
            'Spend 6 resources to research 1 technology.'
        ],
        secondaryAbility: ['Spend 1 token from your strategy pool and 4 resources to research 1 technology.']
    },
    {
        name: 'Imperial',
        initiative: 8,
        primaryAbility: [
            'Immediately score 1 public objective if you fulfill its requirements.',
            'Gain 1 victory point if you control Mecatol Rex; otherwise, draw 1 secret objective.'
        ],
        secondaryAbility: ['Spend 1 token from your strategy pool to draw 1 secret objective.']
    }
];

const EXTENDED_STRATEGY_CARDS = [
    {
        name: 'Industry',
        initiative: 4.5,
        primaryAbility: [
            'Resolve the Production abilities of your units in one system.',
            'Reduce the combined cost of the produced units by 2.'
        ],
        secondaryAbility: ['Spend 1 token from your strategy pool to resolve the Production abilities of your units in one system, producing a maximum of 3 units.']
    },
    {
        name: 'Logistics',
        initiative: 6.5,
        primaryAbility: [
            'Place the HIGH ALERT token in a system.',
            'Your Ships in the system with the HIGH ALERT token gain +1 to all combat rolls and +1 to movement.',
            'If any of your ships start their movement in the token\'s system, you may move the token with this ship.'
        ],
        secondaryAbility: ['Spend 1 token from your strategy pool to move up to 2 of your ships from unactivated systems to adjacent systems with your planets or units.']
    }
];
