import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
// zod and lodash are available globally as `z` and `_`

/**
 * IMPORTANT:
 * Your MVU variable name is `stat_data`.
 * Therefore the schema MUST describe the VALUE of that variable directly:
 * { EngineDerived, PendingState, Preferences, WorldRecord, EventPack, EventSpine, World, Mainchar, Classmate, Intent, MVUStatMenu_DB_Ver, SaveInfo ... }
 */

// -------------------------
// Base atoms
// -------------------------
const strEmpty = z.string().prefault('');
const num0 = z.coerce.number().prefault(0);
const boolFalse = z.coerce.boolean().prefault(false);

// -------------------------
// "Labeled" field helper: [value, label]
// -------------------------
const labeledValue = z
  .tuple([
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
      z.array(z.any()),
      z.object({}).passthrough(),
    ]).prefault(''),
    strEmpty,
  ])
  .prefault(['', '']);

// Convenience typed variants
const labeledStr = z.tuple([strEmpty, strEmpty]).prefault(['', '']);
const labeledNum = z.tuple([num0, strEmpty]).prefault([0, '']);
const labeledBool = z.tuple([boolFalse, strEmpty]).prefault([false, '']);

// A generic "world record entry"
const worldRecordEntrySchema = z.object({}).passthrough().prefault({});

// -------------------------
// EngineDerived
// -------------------------

const engineDerivedSchema = z
  .object({
    Mode: labeledStr,
    DayDate: labeledStr,
    DayLabel: labeledStr,
    DayCheck: labeledStr,
    DaySpine: labeledStr,
    DayCheckRoll: labeledStr,
    TripDestination: labeledStr,
    ValentineGifts: labeledStr,
    DayCompanions: labeledStr,
    ArcLoop: labeledNum,
    Grade: labeledNum,
    BlockReplyCount: labeledNum,
    ClocklessStreak: labeledNum,
    IsClockAheadOfProse: labeledBool,
    LastStepDone: labeledStr,
    ObjectiveStep: labeledStr,
    SpineBandsDone: labeledStr,
    JumpedFrom: labeledStr,
    EventArmed: labeledStr,
    NeglectFired: labeledStr,
  })
  .passthrough()
  .prefault({});


// -------------------------
// PendingState
// -------------------------

const pendingStateSchema = z
  .object({
    BlockDone: labeledBool,
    DayEndOrderedFor: labeledStr,
    AddClassmate: labeledStr,
    AddClassmateArmedAt: labeledNum,
    IntimacyActive: labeledBool,
    HActVerdict: labeledStr,
  })
  .passthrough()
  .prefault({});


// -------------------------
// Preferences
// -------------------------

const preferencesSchema = z
  .object({
    Lang: labeledStr,
  })
  .passthrough()
  .prefault({});


// -------------------------
// WorldRecord
// -------------------------

const worldRecordSchema = z
  .object({
    Locations: z.record(z.string(), z
    .object({
        Label: z.string().prefault(''),
        Note: z.string().prefault(''),
        DiscoveredAt: z.string().prefault(''),
        GrantedBy: z.string().prefault(''),
    })
    .passthrough()
    .prefault({})).prefault({}),
    Events: z.record(z.string(), z
    .object({
        summary: z.string().prefault(''),
        time: z.string().prefault(''),
        scope: z.string().prefault(''),
    })
    .passthrough()
    .prefault({})).prefault({}),
    NPCs: z.record(z.string(), z
    .object({
        Name: z.string().prefault(''),
        Rel: z.string().prefault(''),
        FirstSeen: z.string().prefault(''),
        GrantedBy: z.string().prefault(''),
    })
    .passthrough()
    .prefault({})).prefault({}),
  })
  .passthrough()
  .prefault({});


// -------------------------
// EventPack
// -------------------------

const eventPackSchema = z
  .object({
    triggers: z.record(z.string(), z
    .object({
        cat: z.string().prefault(''),
        series: z.string().prefault(''),
        prereq: z.string().prefault(''),
        when: z.string().prefault(''),
        check: z.string().prefault(''),
        fx: z
        .object({
            summary: z.string().prefault(''),
            scope: z.string().prefault(''),
            writes: z.array(z
            .object({
                path: z.string().prefault(''),
            })
            .passthrough()
            .prefault({})).prefault([]),
        })
        .passthrough()
        .prefault({}),
    })
    .passthrough()
    .prefault({})).prefault({}),
    installed: z.record(z.string(), z
    .object({
        ver: z.string().prefault(''),
        keys: z.array(z.any()).prefault([]),
        prefix: z.string().prefault(''),
    })
    .passthrough()
    .prefault({})).prefault({}),
    fired: z.record(z.string(), z
    .object({
        state: z.string().prefault(''),
        scope: z.string().prefault(''),
        at: z.string().prefault(''),
    })
    .passthrough()
    .prefault({})).prefault({}),
  })
  .passthrough()
  .prefault({});


// -------------------------
// EventSpine
// -------------------------

const eventSpineSchema = z
  .object({
    fired: z.record(z.string(), z
    .object({
        Status: z.string().prefault(''),
    })
    .passthrough()
    .prefault({})).prefault({}),
  })
  .passthrough()
  .prefault({});


// -------------------------
// World
// -------------------------

const worldSchema = z
  .object({
    Date: labeledStr,
    Weekday: labeledStr,
    Time: labeledStr,
    Location: labeledStr,
    Weather: labeledStr,
  })
  .prefault({});


// -------------------------
// Mainchar
// -------------------------

const maincharSchema = z
  .object({
    Name: labeledStr,
    Age: labeledStr,
    Gender: labeledStr,
    Image: labeledStr,
    Race: labeledStr,
    Occupation: labeledStr,
    Identity: labeledStr,
    Mental_state: labeledStr,
    Str: labeledNum,
    Sta: labeledNum,
    Int: labeledNum,
    Cha: labeledNum,
    Energy_curr: labeledNum,
    Energy_max: labeledNum,
    Money: labeledNum,
    Salary: labeledNum,
    Quests: z.record(z.string(), z
    .object({
        Type: z.string().prefault(''),
        Step: z.coerce.number().prefault(0),
        Title: z.string().prefault(''),
        Status: z.string().prefault(''),
        Objective: z.string().prefault(''),
        ProgressSummary: z.string().prefault(''),
        Reward: z.string().prefault(''),
        Desc: z.string().prefault(''),
        LastUpdated: z.string().prefault(''),
        GrantedBy: z.string().prefault(''),
        NextUnlock: z.string().prefault(''),
    })
    .passthrough()
    .prefault({})).prefault({}),
    Skills: z.record(z.string(), z
    .object({
        Desc: z.string().prefault(''),
    })
    .passthrough()
    .prefault({})).prefault({}),
    Belongings: z.record(z.string(), z
    .object({
        Type: z.string().prefault(''),
        Qty: z.coerce.number().prefault(0),
        Desc: z.string().prefault(''),
    })
    .passthrough()
    .prefault({})).prefault({}),
    Inventory: z.record(z.string(), z
    .object({
        Type: z.string().prefault(''),
        Qty: z.coerce.number().prefault(0),
        Desc: z.string().prefault(''),
        GrantedBy: z.string().prefault(''),
    })
    .passthrough()
    .prefault({})).prefault({}),
    CoActivityStatsToday: labeledStr,
    LastTrainingWeek: labeledStr,
    QuestStatPointsToday: labeledNum,
    customFlags: z.object({}).passthrough().prefault({}),
  })
  .prefault({});


// -------------------------
// Classmate (Collection)
// -------------------------

const classmateMemberSchema = z
  .object({
    Name: labeledStr,
    FullName: labeledStr,
    Age: labeledStr,
    Gender: labeledStr,
    Race: labeledStr,
    Identity: labeledStr,
    Occupation: labeledStr,
    Location: labeledStr,
    Height: labeledStr,
    Cup_Size: labeledStr,
    Body_Measurements: labeledStr,
    Hair_Style: labeledStr,
    Physical_Features: labeledStr,
    Persona: labeledStr,
    Biography: labeledStr,
    Secret: labeledStr,
    Image: labeledStr,
    Sta: labeledNum,
    Int: labeledNum,
    Cha: labeledNum,
    Pride: labeledNum,
    Morals: labeledNum,
    Elegance: labeledNum,
    Sociability: labeledNum,
    Kindness: labeledNum,
    Hagaruro: labeledNum,
    Affection: labeledNum,
    DailyAffGain: labeledNum,
    AffectionCapNote: labeledStr,
    PromotedOn: labeledStr,
    Mood: labeledStr,
    Arousal: labeledNum,
    Energy: labeledNum,
    Embarrassment: labeledStr,
    Guilt: labeledStr,
    RelationshipStage: labeledStr,
    ConflictActive: labeledBool,
    Is_present: labeledBool,
    Lewdness: labeledNum,
    ClimaxGauge: labeledNum,
    M_level: labeledNum,
    Exp_Caress: labeledNum,
    Exp_Oral: labeledNum,
    Exp_Vaginal: labeledNum,
    Exp_Anal: labeledNum,
    H_Count: labeledNum,
    EdgeStreak: labeledNum,
    HClimaxed: labeledStr,
    HView: labeledStr,
    Ahegao: labeledBool,
    AhegaoPenalty: labeledBool,
    HPosition: labeledStr,
    HScene: labeledStr,
    HBeatsHers: labeledNum,
    HBeatsHis: labeledNum,
    ImportantEvents: z.record(z.string(), z
    .object({
        Desc: z.string().prefault(''),
        TimeStamp: z.string().prefault(''),
    })
    .passthrough()
    .prefault({})).prefault({}),
    Friends: z.record(z.string(), z
    .object({
        Name: z.string().prefault(''),
        FriendshipScore: z.string().prefault(''),
        Mood: z.string().prefault(''),
    })
    .passthrough()
    .prefault({})).prefault({}),
    Hobbies: z.record(z.string(), z
    .object({
        Desc: z.string().prefault(''),
    })
    .passthrough()
    .prefault({})).prefault({}),
    Thoughts: labeledStr,
    Belongings: z.record(z.string(), z
    .object({
        Type: z.string().prefault(''),
        Qty: z.coerce.number().prefault(0),
        Desc: z.string().prefault(''),
    })
    .passthrough()
    .prefault({})).prefault({}),
    Base100: labeledNum,
    Base400: labeledNum,
    TimeSinceLastSeen: labeledStr,
    LastInitiative: labeledStr,
    customFlags: z.object({}).passthrough().prefault({}),
    Profile: labeledStr,
  })
  .prefault({});


const classmateSchema = z.record(z.string(), classmateMemberSchema).prefault({});

// -------------------------
// Intent
// -------------------------

const intentSchema = z
  .object({
    check: labeledStr,
    mundane: labeledStr,
    relationship: labeledStr,
    fwb: labeledStr,
    puppy: labeledStr,
    dayCheck: labeledStr,
    sceneAdvance: labeledBool,
    sceneClock: labeledStr,
    pastMidnight: labeledBool,
    stepDone: labeledStr,
    armClassmate: labeledStr,
    resolvedFor: labeledStr,
    postResolvedFor: labeledStr,
    training: labeledStr,
    initiative: labeledStr,
    location: labeledStr,
    arrive: labeledStr,
    presentAtEnd: labeledStr,
    daySwing: labeledStr,
    eventFire: labeledStr,
    recordEvent: labeledStr,
    recordNPC: labeledStr,
    money: labeledStr,
    friends: labeledStr,
    record: labeledStr,
    quest: labeledStr,
    intimacy: labeledStr,
    hact: labeledStr,
    newClassmate: z.record(z.string(), z
    .object({
        key: z.string().prefault(''),
        Name: z.string().prefault(''),
        Age: z.string().prefault(''),
        Gender: z.string().prefault(''),
        Race: z.string().prefault(''),
        Occupation: z.string().prefault(''),
        Identity: z.string().prefault(''),
        Height: z.string().prefault(''),
        Cup_Size: z.string().prefault(''),
        Body_Measurements: z.string().prefault(''),
        Hair_Style: z.string().prefault(''),
        Physical_Features: z.string().prefault(''),
        Persona: z.string().prefault(''),
        Biography: z.string().prefault(''),
        Secret: z.string().prefault(''),
        Image: z.string().prefault(''),
        Sta: z.coerce.number().prefault(0),
        Int: z.coerce.number().prefault(0),
        Cha: z.coerce.number().prefault(0),
        Pride: z.coerce.number().prefault(0),
        Morals: z.coerce.number().prefault(0),
        Elegance: z.coerce.number().prefault(0),
        Sociability: z.coerce.number().prefault(0),
        Kindness: z.coerce.number().prefault(0),
        Hagaruro: z.coerce.number().prefault(0),
        Hobbies: z.string().prefault(''),
    })
    .passthrough()
    .prefault({})).prefault({}),
  })
  .passthrough()
  .prefault({});


// -------------------------
// SaveInfo
// -------------------------

const saveInfoSchema = z
  .object({
    GameStarted: z.coerce.boolean().prefault(false),
  })
  .passthrough()
  .prefault({});


// -------------------------
// StatData root (THIS is the value of MVU variable `stat_data`)
// -------------------------
export const StatDataSchema = z
  .object({
    EngineDerived: engineDerivedSchema,
    PendingState: pendingStateSchema,
    Preferences: preferencesSchema,
    WorldRecord: worldRecordSchema,
    EventPack: eventPackSchema,
    EventSpine: eventSpineSchema,
    World: worldSchema,
    Mainchar: maincharSchema,
    Classmate: classmateSchema,
    Intent: intentSchema,
    MVUStatMenu_DB_Ver: z.string().prefault(''),
    SaveInfo: saveInfoSchema,
    $mvuhelper: z.record(z.string(), z.any()).prefault({}),   // platform-owned: the lock would strip it
    GameLogicPlugin: z.record(z.string(), z.any()).prefault({}),   // platform-owned: the lock would strip it
  })
  .prefault({});

// -------------------------
// Register
// -------------------------
$(() => {
  registerMvuSchema(StatDataSchema);
});
