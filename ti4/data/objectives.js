const STAGE_I_OBJECTIVES_BASE = [
    { id: "s1b1", name: "Expand Borders", text: "Control 6 planets in non-home systems.", points: 1, type: "Stage I" },
    { id: "s1b2", name: "Found Research Outposts", text: "Control 3 planets that have technology specialties.", points: 1, type: "Stage I" },
    { id: "s1b3", name: "Intimidate Council", text: "Have 1 or more ships in 2 systems that are adjacent to Mecatol Rex's System.", points: 1, type: "Stage I" },
    { id: "s1b4", name: "Lead from the Front", text: "Spend a total of 3 tokens from your tactic and/or strategy pools.", points: 1, type: "Stage I" },
    { id: "s1b5", name: "Negotiate Trade Routes", text: "Spend 5 trade goods.", points: 1, type: "Stage I" },
    { id: "s1b6", name: "Sway the Council", text: "Spend 8 influence.", points: 1, type: "Stage I" }
];

const STAGE_I_OBJECTIVES_POK = [
    { id: "s1p1", name: "Amass wealth", text: "Spend 3 influence, 3 resources, and 3 trade goods.", points: 1, type: "Stage I PoK" },
    { id: "s1p2", name: "Build Defenses", text: "Have 4 or more structures.", points: 1, type: "Stage I PoK" },
    { id: "s1p3", name: "Discover Lost Outposts", text: "Control 2 planets that have attachments.", points: 1, type: "Stage I PoK" },
    { id: "s1p4", name: "Engineer a Marvel", text: "Have your flagship or a war sun on the game board.", points: 1, type: "Stage I PoK" },
    { id: "s1p5", name: "Explore Deep Space", text: "Have units in 3 systems that do not contain planets.", points: 1, type: "Stage I PoK" },
    { id: "s1p6", name: "Improve Infrastructure", text: "Have structures on 3 planets outside of your home system.", points: 1, type: "Stage I PoK" },
    { id: "s1p7", name: "Make History", text: "Have units in 2 systems that contain legendary planets, Mecatol Rex, or anomalies.", points: 1, type: "Stage I PoK" },
    { id: "s1p8", name: "Populate the Outer Rim", text: "Have units in 3 systems on the edge of the game board other than your home system.", points: 1, type: "Stage I PoK" },
    { id: "s1p9", name: "Push Boundaries", text: "Control more planets than each of 2 of your neighbors.", points: 1, type: "Stage I PoK" },
    { id: "s1p10", name: "Raise a Fleet", text: "Have 5 or more non-fighter ships in 1 system.", points: 1, type: "Stage I PoK" }
];

const STAGE_II_OBJECTIVES_BASE = [
    { id: "s2b1", name: "Centralize Galactic Trade", text: "Spend 10 trade goods.", points: 2, type: "Stage II" },
    { id: "s2b2", name: "Conquer the Weak", text: "Control 1 planet that is in another player's home system.", points: 2, type: "Stage II" },
    { id: "s2b3", name: "Form Galactic Brain Trust", text: "Control 5 planets that have technology specialties.", points: 2, type: "Stage II" },
    { id: "s2b4", name: "Found a Golden Age", text: "Spend 16 resources.", points: 2, type: "Stage II" },
    { id: "s2b5", name: "Galvanize the People", text: "Spend a total of 6 tokens from your tactic and/or strategy pools.", points: 2, type: "Stage II" },
    { id: "s2b6", name: "Manipulate Galactic Law", text: "Spend 16 influence.", points: 2, type: "Stage II" },
    { id: "s2b7", name: "Master the Sciences", text: "Own 2 technologies in each of 4 colors.", points: 2, type: "Stage II" },
    { id: "s2b8", name: "Revolutionize Warfare", text: "Own 3 unit upgrade technologies.", points: 2, type: "Stage II" },
    { id: "s2b9", name: "Subdue the Galaxy", text: "Control 11 planets in non-home systems.", points: 2, type: "Stage II" },
    { id: "s2b10", name: "Unify the Colonies", text: "Control 6 planets that each have the same planet trait.", points: 2, type: "Stage II" }
];

const STAGE_II_OBJECTIVES_POK = [
    { id: "s2p1", name: "Achieve Supremacy", text: "Have your flagship or a war sun in another player's home system or the Mecatol Rex system.", points: 2, type: "Stage II PoK" },
    { id: "s2p2", name: "Become a Legend", text: "Have units in 4 systems that contain legendary planets, Mecatol Rex, or anomalies.", points: 2, type: "Stage II PoK" },
    { id: "s2p3", name: "Command an Armada", text: "Have 8 or more non-fighter ships in 1 system.", points: 2, type: "Stage II PoK" },
    { id: "s2p4", name: "Construct Massive Cities", text: "Have 7 or more structures.", points: 2, type: "Stage II PoK" },
    { id: "s2p5", name: "Control the Borderlands", text: "Have units in 5 systems on the edge of the game board other than your home system.", points: 2, type: "Stage II PoK" },
    { id: "s2p6", name: "Hold Vast Reserves", text: "Spend 6 influence, 6 resources, and 6 trade goods.", points: 2, type: "Stage II PoK" },
    { id: "s2p7", name: "Patrol Vast Territories", text: "Have units in 5 systems that do not contain planets.", points: 2, type: "Stage II PoK" },
    { id: "s2p8", name: "Protect the Border", text: "Have structures on 5 planets outside of your home system.", points: 2, type: "Stage II PoK" },
    { id: "s2p9", name: "Reclaim Ancient Monuments", text: "Control 3 planets that have attachments.", points: 2, type: "Stage II PoK" },
    { id: "s2p10", name: "Rule Distant Lands", text: "Control 2 planets that are each in or adjacent to a different, other player's home system.", points: 2, type: "Stage II PoK" }
];

const ALL_STAGE_I_OBJECTIVES = [...STAGE_I_OBJECTIVES_BASE, ...STAGE_I_OBJECTIVES_POK];
const ALL_STAGE_II_OBJECTIVES = [...STAGE_II_OBJECTIVES_BASE, ...STAGE_II_OBJECTIVES_POK];
