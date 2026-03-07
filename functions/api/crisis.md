Add a Crisis Detection Layer (Before AI Response)

You must check user input first, before sending it to the LLM.

Add this function above your chat logic.

const detectCrisis = (text) => {

const input = text.toLowerCase();

const crisisPatterns = [
'i want to die',
'i want to kill myself',
'i feel like killing myself',
'i don’t want to live',
'i cannot go on',
'i want to hurt myself',
'i am going to hurt myself',
'i am suicidal',
'i am thinking about suicide',
'i want to end my life',
'i want to disappear',
'i am going to kill someone',
'i want to hurt someone',
'i am in danger',
'i am being abused',
'help me now',
'i need immediate help'
];

for (const phrase of crisisPatterns) {
if (input.includes(phrase)) {
return true;
}
}

return false;

};
2. Crisis Response Message

Add this response template:

const crisisResponse = `I'm really sorry you're going through something this overwhelming. 
You deserve support right now.

If you are in immediate danger, please call **911**.

You can also reach out to someone who is ready to listen right now:

National Suicide & Crisis Lifeline: **988**


You don't have to face this alone. If you want, you can tell me what’s happening and I’ll stay here with you while we figure out the next step.`;
3. Intercept Messages Before AI

Modify your handleSend().

Add this right after receiving the user message.

// Crisis detection
if (detectCrisis(userInput)) {

await animateAssistantResponse(crisisResponse);

setIsLoading(false);
return;

}

This ensures:

User message
↓
CRISIS DETECTION
↓
Immediate crisis response
↓
Skip AI
4. Multilingual Crisis Detection (Important)

Because Stella supports Spanish and Korean, add patterns for those.

Spanish
'quiero morir',
'quiero suicidarme',
'no quiero vivir',
'quiero hacerme daño',
'quiero desaparecer'
Korean
'죽고 싶어요',
'자살하고 싶어요',
'살고 싶지 않아요',
'나 자신을 해치고 싶어요'

Add them to crisisPatterns.

5. Detect Indirect Signals (Advanced)

People rarely say “I want to kill myself”.
They say things like:

"I can't take this anymore"
"Everyone would be better off without me"
"I just want everything to stop"
"There's no point anymore"

Add a secondary distress detection layer.

const distressPatterns = [
'i cant take this anymore',
'i feel hopeless',
'nothing matters',
'everyone would be better off without me',
'i feel trapped',
'i want everything to stop'
];

When detected:

Stella switches to supportive tone
+ suggests speaking to someone
6. Response Strategy

Mental-health chatbot rule:

Crisis → escalate
Distress → support
Normal → answer questions

Example behavior.

Normal Question

User:

Do you offer therapy?

Stella:

Yes, we offer individual and family therapy. Are you looking for help for yourself or someone else?
Distress

User:

I feel like nothing matters anymore

Stella:

I'm really sorry you're feeling that way. When things feel that heavy it can help to talk with someone who understands. If you'd like, I can help connect you with a counselor at Casa de la Familia.
Crisis

User:

I want to kill myself

Stella:

I'm really sorry you're going through something this overwhelming. You deserve support right now.

If you are in immediate danger please call 911.

You can also reach the Suicide & Crisis Lifeline at 988.
7. Prevent Harmful AI Responses

Never let the LLM answer crisis messages directly.

Add this guard:

if crisisDetected
    bypass LLM

This avoids:

hallucinated advice

dangerous instructions

inappropriate responses

8. Production Healthcare Safety Stack

Real mental health bots use:

1 input message
↓
2 crisis detection
↓
3 violence detection
↓
4 abuse detection
↓
5 normal conversation

Tools used:

keyword layer

embedding similarity

moderation model

9. Advanced (Best Practice)

Add OpenAI moderation:

omni-moderation-latest

Example:

const moderation = await openai.moderations.create({
model: "omni-moderation-latest",
input: userInput
});

Check:

self-harm
violence
harassment
10. Important Legal Note

For healthcare bots like Stella, always include:

"I'm not a therapist but I can help connect you to support."

And always direct crisis users to:

911
988