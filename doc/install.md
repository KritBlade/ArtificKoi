# Install ArtificKoi

ArtificKoi runs on MVU Helper, and MVU Helper rides on 2 other SillyTavern extensions, Tavern Helper and ST-Prompt-Template. So you install those 2 first, then MVU Helper, then the card. It takes about 5 minutes.

## 1. Switch SillyTavern to English

SillyTavern > User Settings > Language > **English**.

My docs use the English name for every menu and every setting. With SillyTavern in English, what you see on screen matches what you read here.

![User Settings in SillyTavern, with Language set to English at the top right](../Image/Install/language.png)

## 2. Install Tavern Helper

SillyTavern > Extensions > Install extension. Paste this link, and click Install:

```
https://github.com/N0VI028/JS-Slash-Runner
```

## 3. Install ST-Prompt-Template

Same place. SillyTavern > Extensions > Install extension. Paste this link, and click Install:

```
https://github.com/zonde306/ST-Prompt-Template
```

## 4. Turn on Environmental isolation

This one is VERY important. Don't skip it.

SillyTavern > Extensions > Prompt template settings > tick **Environmental isolation**. It's near the bottom of the list.

A lorebook entry with EJS is JavaScript running on your SillyTavern page. With isolation on, it runs in a sandbox that refuses network requests. It's off by default, so turn it on before you load any card. It needs ST-Prompt-Template 1.17.8.2 or later.

![Prompt template settings, with Environmental isolation ticked near the bottom](../Image/Install/environmental_isolation.png)

## 5. Install MVU Helper

Same place again. SillyTavern > Extensions > Install extension. Paste this link, and click Install:

```
https://github.com/KritBlade/mvu-helper
```

## 6. Let MVU Helper install MVU

The first time MVU Helper loads, it asks "Install MVU now?". Click **Install**. It adds MVU as a global Tavern Helper script, so every MVU card can use it.

If you said no, that's fine. MVU Helper > Main tab > **Install MVU** does the same thing later. Until MVU is installed, every game feature stays off.

## 7. Download and import ArtificKoi

Download the card, [ArtificKoi.png](../dist/ArtificKoi.png). On its GitHub page, click the download button at the top right.

Then SillyTavern > Character Management > **Import Character from File**, and pick `ArtificKoi.png`.

SillyTavern then asks whether to import the card's embedded World/Lorebook. Click **Yes**. That lorebook is the game itself, and ArtificKoi can't run without it. If it asks to allow the card's scripts or regex too, say yes to those as well.

That's it. Open ArtificKoi's chat and start playing. What each of these extensions does is on [What is Tavern Helper, ST-Prompt-Template and MVU](https://github.com/KritBlade/mvu-helper/blob/main/doc/st_extensions/README.md).

[Back to index](../README.md)
