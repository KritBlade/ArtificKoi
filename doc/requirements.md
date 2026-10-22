# ArtificKoi requirements

## Image generation

Image generation is optional, but this is what it takes.  That means you CAN play without image generation.

You need a working ComfyUI installation. New to ComfyUI? Start with my [ComfyUI setup guide](https://github.com/KritBlade/mvu-helper/blob/main/doc/image_gen/comfyui_setup.md).

You need a video card with 6GB of VRAM or more, and I recommend 12GB or more. That card is busy drawing the pictures, so the story has to come from an API model. The only way around it is 2 beefy PCs at home, one for the pictures and one for the story.

## The AI model

The smallest local model that works is Gemma 31B. It does forget to trigger an event from time to time.  Gemma4 31B prose great, but it is [dumb](../Image/Readme/intelligence_index.png).

For a local model, I recommend Qwen 3.8 27B, it's an agentic model so it smart enough to work with a game engine, however, it doesn't prose as good as Gemma4.

Small MoE like Gemma4 26B A4B models don't work. Besides writing the story, the AI has to write a proper command to draw a picture in ComfyUI, trigger events at the right time, changing outfit at the right place and a MoE model doesn't even know how to do that.  For local model, always change the thinking effort to high in the preset.  This is the only thing that can keep local model writing correct command to draw the picture and trigger event correctly.

My recommended setup is an API model for the story: Gemini Flash 3.8, Gemini 4 Argon, GLM 5.3, Sonnet 4.6 or above, or Opus. GLM 5.3 Flash works OK, but sometimes it forgets to draw the picture, and it tend to write very short reply. 

## The PRE and POST calls

ArtificKoi runs 2 extra calls every reply, besides the main one that writes the story. PRE runs before the reply, and POST runs after it.

They take work off the main call, which is the expensive one. PRE rolls the checks and gets the instructions ready before the story is written. POST reads the finished reply and reports back what happened in it.

You have to pick a connection profile for each of them. MVU Helper > **Extra LLM Calls** > set the **Connection** on both PRE and POST.

Pick a model that is smart enough, but cheap and fast, like GPT 5.6 Luna. They run every single reply, so a pricey model here adds up fast.

![MVU Helper's Extra LLM Calls, with a connection picked for PRE and for POST](../Image/Readme/pre_post_calls.png)

How these calls work is on [Extra LLM Calls](https://github.com/KritBlade/mvu-helper/blob/main/doc/extra_llm_calls/README.md).

## Preset and SillyTavern settings

Any preset works, including Freaky Frankenstein 5.4 and Megumin v10 or later. Even SillyTavern's plain "Default" works.

If your preset comes with its own logic adjustments, turn those off. The game already has a logic system far more advanced than any preset can do.  Moreover, please make the output length to no less than 600 words because a lot of events is a long story.

Set the context size to 300,000 and the max response length to 15,000. The game won't really use that many tokens. SillyTavern just doesn't know there's code inside the lorebook, so it expects way more tokens than will really be sent.

## Checking your token use

A prompt inspector that estimates your token use most likely shows the wrong number. It counts all the code in the lorebook as if it goes to the AI, and it doesn't.

The accurate way is the Prompt Viewer, in the magic wand menu. The upper left shows the tokens that will really be sent.

![The magic wand menu, with Prompt Viewer at the top](../Image/Readme/prompt_viewer.png)

## A memory extension

I **highly recommend** a memory extension that ghosts ALL the history except the very last reply. Use my other project [VectFox](https://github.com/KritBlade/VectFox), or [Summaryception](https://github.com/Lodactio/Extension-Summaryception).

In VectFox, turn on Enable Auto-Sync and Summarizer Injection, and inject the last 20 turns. Turn on Include full event detail. Then turn on Ghost vectorized messages, and keep the last 1 message verbatim.

![VectFox's Chat Auto-Sync settings for ArtificKoi](../Image/Readme/vectfox_settings.png)

For reference, my own story at floor 440 sends about 50,800 tokens a reply on Gemini 4 Argon. That already includes image generation, every event trigger and the full summary of the last 20 replies.

[Back to index](../README.md)