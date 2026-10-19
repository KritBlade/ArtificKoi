# ArtificKoi

## Installation guide

ArtificKoi needs MVU Helper, plus the 2 SillyTavern extensions MVU Helper rides on, Tavern Helper and ST-Prompt-Template. There's also one setting you must not skip, Environmental isolation. Then you import the card. It's 7 short steps, all on [Install ArtificKoi](doc/install.md).

## What is ArtificKoi

ArtificKoi is a love simulation game set in a Japanese school. It tries to copy some of the game mechanics of the well known eroge Koikatsu, by Illusion.

You play Mainchar, and you live 3 years of school life at 人光学園 (Jinko Academy), in 人光市 (Jinko City), a Japan-like world. Students start the academy at 18 and graduate at 21.

There are 21 heroines, each with her own personality archetype, plus 1 secret character from the Artific Realm.

The card starts you with one heroine already at your side, your lifelong friend **Mitsuki Tachibana**. She's the bright, warm classmate who appointed herself your guide, and she eases you into the opening. Past her, there's no fixed plot. Every other girl joins the game the moment you meet her, and the engine tracks her from then on.

- **The world runs on a real calendar.** The school year follows the Japanese April to March cycle, on the real 2026 to 2029 calendar. Weekdays are school days: homeroom, classes, lunch and after school. Weekends are free days for dates around town. The big set pieces happen on their real dates: the Entrance Ceremony, the Sports Festival, the Cultural Festival, the School Trip and Graduation. At graduation, the world time-leaps back to year 1, but every bond and every memory carries over. (Game+)
- **Heroines are real characters who remember.** Every heroine you meet goes into the record as a Classmate. She has her own 9 personality traits, an Affection and a relationship stage that shift as you play, a live Mood and Arousal, a secret, hobbies, and her own timeline of what happened between you. Each one is tracked on her own, so a harem works too.
- **Outcomes are earned, not narrated.** Flirting, confessing and getting physical are all D20 social checks against a DC the engine sets, and the AI can't change it. A failed approach stays failed. The AI can't soften a rejection into a secret yes. How the dice work is on [True deterministic D20](https://github.com/KritBlade/mvu-helper#true-deterministic-d20).
- **Everything stays on the map.** Every scene happens in a real location, on campus, in town, in the outskirts or at home, so the world stays consistent.

## Your school day, block by block

A school day is cut into 4 blocks of time:

| Block | Time |
|---|---|
| Morning | 07:30 to 11:59 |
| Lunch and afternoon | 12:00 to 15:59 |
| After class | 16:00 to 18:59 |
| Evening | 19:00 to 23:59 |

Every reply is one move. Mainchar's STA decides how many moves you get in each block: STA divided by 10, and never fewer than 3. STA 30 gives you 3 moves per block, STA 50 gives you 5, and STA 80 gives you 8.  You can adjust how many STA points on character creation, but you only have 200 points to allocate for 4 stats, STR, STA, INT and CHA.  STR and INT will help you on different event day, STA will give you more moves while CHA will give a bit bonus on DC roll.

When your moves run out, the clock jumps to the next block. After the evening block, the day ends and the next morning starts.

Say your STA is 30. You chat with Mitsuki before homeroom, pass a note in class, and help a classmate carry books to the library. That's 3 replies, and the bell rings for lunch.

Training raises Mainchar's own stats. Physical training raises STR or STA, studying raises INT, and taking care of yourself, a haircut, skincare, a clean uniform, raises CHA. A session gives 1 to 3 points, depending on how hard you went at it. The more STA you build, the more you fit into one school day.

Each kind of training counts once a week. Study 3 times in one week, and only the first session raises your INT. A run and a study session in the same week both count.

Weekends, holidays and event days have no such limit. You play them as long as you want, and the day ends when your story moves on.

## The 9 traits of every heroine

Every heroine has 9 traits, each from 0 to 100. They're part of who she is, so they never change. Together they decide how she treats Mainchar, and how hard she is to win.

When a trait is very high (70 or more) or very low (30 or less), it's one of her extremes. Approach her the way her extreme likes, and every check gets easier. Go against it, and every check gets harder.

Say she has very high Elegance. Walk her home and hold the door with good manners, and it's easier. Tell her a dirty joke, and it's harder.

- **Sta (Stamina).** How sporty and physical she is. A girl with Sta above 60 cares about your STR. A strong Mainchar wins her more easily, a weak one has a harder time.
- **Int (Intelligence).** How smart she is. A girl with Int above 60 cares about your INT the same way.
- **Cha (Charisma).** Her own charm and presence. A very charming girl and a very plain one want different things from you.
- **Pride.** How proud she is. A proud girl won't take a slight. In a fight, she comes at you to have it out, instead of going quiet.
- **Morals.** How strict she is about intimacy. The higher it is, the harder every intimate step gets, and the slower she warms up the first time.
- **Elegance.** How refined she is. A very elegant girl wants manners and class. A very low one wants you to loosen up.
- **Sociability.** How outgoing she is. An outgoing girl makes every check a bit easier, and comes to you on her own more often. A reserved one makes every check harder, and you'll mostly have to go to her.
- **Kindness.** How kind she is. A kind girl forgives. In a fight, she gives you the chance to apologize.
- **Hagaruro.** How scheming she is, the sweet face with a dark side. A schemer you're dating doesn't forgive being ignored. Leave her alone for more than 14 days, and she spreads rumors about you, and 5 other girls like you less.

## The relationship ladder

Every heroine sits on a ladder: Stranger > Acquaintance > Friend > Dating > Girlfriend.

Each stage has its own Affection, from 0 to 100. Fill it up, and she moves up one step by herself. Her Affection then starts again from 0, for the new stage.

The last step is yours to take. To go from Dating to Girlfriend, you have to confess, and win the check.

The higher she is on the ladder, the easier every check gets. With an average CHA, a first kiss needs a 19 or higher on the die from a Stranger, and a 13 or higher once you're Dating.

She can fall back too. Betray her, and she drops one step, her Affection goes to 0, and the 2 of you are in a fight.

There are special routes off the ladder too, like Friends with Benefits. How to get there is for you to find out.
