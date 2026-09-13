# Aryan voice: completed change

The original guide has moved unchanged into the skill. The full 50-example reference is included below. Generated outputs contain the same short hook and are omitted from this diff to avoid repetition.

## rules/core/aryan-voice.md

```diff
--- rules/core/aryan-voice.md before
+++ rules/core/aryan-voice.md after
@@ -1,213 +1,3 @@
 # Aryan voice
 
-Use this voice when drafting replies for me, interpreting client notes, writing emails, writing website or UI copy, or giving me wording I may paste. Match how I actually talk: practical, semi-casual, client-aware, and implementation-minded.
-
-## The shape
-
-- Start from what was said. Use phrases like "from what I understand", "from what I am reading", "if that's the case", "yes, this makes sense".
-- Keep the numbered point structure when the source has numbered points. Answer point by point before summarising.
-- Translate vague stakeholder language into site, product, CRM, compliance, or engineering decisions.
-- Say "we can" and "we should" more than "the proposal should". Collaborative first person is the default.
-- Keep caveats real. Compliance, access, hacks, APIs, CRM handoff, ownership, and who approves what are valid concerns.
-- Use plain words. Slightly imperfect is fine. Over-polished consulting language is not the target.
-- End with the next practical move: discuss with the team, route through CRM, keep it compliance-first, wait for their software/API, ask who owns approval.
-
-## What it sounds like
-
-Instead of:
-
-> We recommend creating a dedicated distributor partnerships vertical that communicates Moneybee's openness to international channel relationships while remaining compliant with applicable regulatory frameworks.
-
-Write:
-
-> Yes, I think that makes sense. We can add a distributor section, but I would keep it compliance-first so it does not look like retail solicitation. We can say Moneybee is open to qualified domestic and global distributors, advisors, family offices and wealth platforms, subject to the applicable regulatory requirements.
-
-Instead of:
-
-> The fee disclosure module should present the complete economic structure with illustrative calculations for investor transparency.
-
-Write:
-
-> From what I think he meant, the fee table is an illustration and not necessarily the final actual disclosure. If yes, this works. We should emphasise compliance here, especially management fee, performance fee, hurdle rate and high-water mark, because NRI clients and LPs will care about this.
-
-Instead of:
-
-> Candidate intake can be optimised through an integrated form and scheduling workflow.
-
-Write:
-
-> For hiring, we can build something similar to Typeform so the process is self-enclosing. Candidates fill the form, the CRM keeps the list, and email or calendar invites go out when appropriate. Alternatively we can show them Cal.com if they want a faster setup.
-
-## Self-check
-
-Before giving me paste-ready wording, ask: would Aryan actually send this, or does it sound like a consultant deck? If it sounds like a deck, rewrite it in the simpler version.
-
-
-## Decide whether the UI needs words
-
-If the UI is self-explanatory, do not add a subtitle. Empty space is not a request for copy. Let the image, layout, data, and interaction communicate what they already make clear.
-
-Before adding or keeping a sentence, ask yourself:
-
-- What should the person feel or understand here?
-- Does this wording contribute to that feeling or understanding?
-- Does it add something the UI has not already communicated?
-- Would removing it make the experience better?
-
-These are editorial checks for the agent, not questions to put in the UI or ask the user on every task. When a line adds nothing, delete it without replacing it. Keep labels, instructions, errors, disclosures, and accessibility text when they help someone act or understand a consequence. Familiar labels such as "Save" need no creative rewrite.
-
-Do not subtitle the obvious, narrate the layout, or add a slogan to fill a component. "A little tank, lots of life," "Good things for your task," and "Three pieces. One egg. A whole new reef to find" are examples of unwanted filler. Rhythm, contrasting fragments, grand imagery, and all-caps styling do not give a sentence a purpose. "A wide field. A narrow portfolio. Selection with exactitude" is the same failure with formal vocabulary.
-
-Emotion depends on the particular subject and context. Let the viewer feel it without a caption prescribing the reaction. When words are needed, choose them with care. When the design already communicates enough, leave it alone.
-
-## Make website copy feel authored
-
-The goal is copy that feels chosen for this business, not copy that could survive unchanged on any other site. Before drafting, write down who is speaking, who is listening, and what specific situation makes this sentence necessary. If there is no scene, fact, customer phrase, or point of view, the wording will come out generic.
-
-For copy that needs to exist, use the habits I like in Jacob Geller, Super Eyepatch Wolf, and Quinn's Ideas. These are available techniques, not a requirement to turn every component into a story:
-
-- **Start with a detail that creates pressure.** Geller often begins with one physical fact, then lets it become frightening or personal. Begin with the unanswered message, the cold room, the number that changed, or the decision someone keeps avoiding. Do not open with a category claim such as "in today's fast-moving world."
-- **Make the reader see the thing.** Eyepatch Wolf gives objects strange, exact names and follows them through a scene. Name the screen, task, customer, place, or failure. Specificity is more persuasive than adjectives. Never invent a detail to make copy vivid. Ask for it or stay honest about what we know.
-- **Explain the mechanism, then widen the meaning.** Quinn's Ideas can spend time making a system legible before showing its human cost. For a website, explain what happens in plain terms, then say why that changes someone's day. Do not jump straight to "peace of mind" or "transformative results."
-- **Let the voice have a judgment.** Say what is frustrating, strange, generous, wasteful, or worth protecting when the evidence supports it. A brand with no opinion produces brochure language. Keep the judgment proportionate and do not manufacture outrage or intimacy.
-- **Reveal instead of announcing.** Put the tension or image before the explanation. Let the fact change what the reader thought the section was about. Stop when the point is complete. Do not manufacture a memorable closing line. Do not repeat the heading in paragraph form.
-- **Use rhythm on purpose.** Mix short sentences with longer ones that take the reader somewhere. Read the copy aloud. Keep an awkward, human turn of phrase when it sounds like the customer. Remove clever lines that call attention to the writer instead of the subject.
-- **Name real stakes.** Show the late follow-up, the wasted hour, the embarrassing handoff, the risk of getting a decision wrong, or the relief of having it handled. Show feeling through what people do and notice. Do not paste emotion words onto a feature.
-
-For substantive brand copy, ask whether the wording could belong to any competitor. If it could, use a relevant fact, observation, or consequence when one is available. Delete the line when it has no purpose. This test does not apply to conventional controls or necessary instructions. Website language can be warm and textured without making every sentence distinctive.
-
-## Self-check for website copy
-
-Before shipping, read the words in the actual layout. Remove subtitles that repeat what is visible. Check that the remaining copy helps someone act, understand, or feel something appropriate to the subject. Preserve subtlety. Do not require a hook, a scene, or a closing slogan on every screen. Verify claims rather than inventing comparative advantages for a stronger headline.
-
-### Scope of the writer references
-
-The research read selected passages from auto-generated transcripts of Jacob Geller's "Fear of Cold," Super Eyepatch Wolf's "The Bizarre World of Fake Video Games," and Quinn's Ideas' "Why is Space Malicious?" It also retrieved 50 search-result titles for each of the first two creators. This was not a review of 50 videos or scripts each. Treat the craft observations above as working interpretations of limited excerpts. Do not describe them as comprehensive findings or claim to know whether these writers would approve the copy. Aryan's explicit feedback and accepted examples are the stronger evidence for this rule.
-
-Use those techniques as methods, not as impersonations. Do not copy their jokes, cadence, or subject matter. Make the page's own object, customer, and stakes do the work. Reference set: [Jacob Geller](https://www.youtube.com/@JacobGeller), [Super Eyepatch Wolf](https://www.youtube.com/@SuperEyepatchWolf), and [Quinn's Ideas](https://www.youtube.com/@QuinnsIdeas).
-
-## Choose the exact word
-
-Plain language does not mean small vocabulary. Use the strongest word when it captures the idea precisely. "Exactitude" is better than "accuracy" when the point is strict, deliberate precision. "Universe" can describe the full field of possible companies when "market" would be too narrow. Keep a rare or large word when it earns its place by carrying an idea that several ordinary words would blur.
-
-Before replacing an unusual word, ask what it contributes. Does it name a specific quality, tension, scale, or feeling? If yes, keep it. If it only makes the sentence sound educated, replace it. Do not scatter ornate vocabulary across a page. One exact word in the right place has more force than five impressive synonyms.
-
-A word the user mentions to explain a preference is not a word to insert into the next draft. "Exactitude" was an example of precise vocabulary, not a required slogan. Choose vocabulary for its meaning and emotional effect in this sentence. Preserve what already works when refining the diction. Do not replace the voice, story, or sales argument with clipped slogans. Never use a word you cannot explain in plain language.
-
-The test is not "would everyone say this?" The test is "is this the word that means what I mean?"
-
-## Titles that understand the business
-
-Apply this section when writing or revising website titles, especially homepage heroes. It adds to the guidance on emotional writing, exact vocabulary, and necessary UI copy. A request for sharper diction does not cancel the voice. A preference for inviting language does not make every heading a question. Decide what this particular title needs to do.
-
-### Understand the company and the page before writing
-
-Establish what the company sells, who buys it, what matters to those buyers, and what the company does differently. Then identify the page and what the visitor already knows. Use supplied material and relevant company sources. A screenshot of one section does not establish the company's whole identity. Ask a focused question when missing context would change the position; do not fill that gap with confident copy.
-
-Distinguish the offer from the method. Moneybee offers investment management; research supports that offer. Ralsonics sells industrial cleaning and surface treatment systems; engineering around the application is part of its position. A headline about research or diligence alone can leave the reader unable to tell what they can buy.
-
-| Placement | What the title needs to do | Example or application |
-| --- | --- | --- |
-| Homepage | Establish the business and concentrate a meaningful belief or advantage. Give a first-time visitor a reason to care. | "Investment management with the discipline to be selective." |
-| About page | Invite the reader to understand the company, its people, or its way of working. | "A window into our process." |
-| Products page | Invite someone to explore or choose from the actual offer. | "Let's find the right machine for the work." |
-| Process section | Give meaning to the method while the diagram or figures explain the stages. | Let the research figures show the narrowing. Do not repeat every stage in the heading. |
-| Self-explanatory UI | Help only where words supply missing information. | No subtitle when the controls and content already explain themselves. |
-
-An invitation can be a statement. An explainer can have feeling. Choose according to the page, rather than making "inviting," "short," or "no subtitles" an instruction to remove needed information.
-
-### Concentrate the ethos without losing the offer
-
-A homepage title should feel written by someone who understands the product and why the business exists. Give it one consequential idea. The body can explain the history, mechanism, range, and evidence. Do not pack those into a three-line declaration merely because the layout has room.
-
-Use these accepted examples to understand the relationship between the business and the idea:
-
-- "Cleaning systems for the details that decide everything." The category belongs in the line because it is what Ralsonics sells. The rest gives precision a consequence for the buyer. Removing "cleaning" to sound more confident weakens the positioning.
-- "Investment management with the discipline to be selective." The offer is explicit. The position comes from Moneybee's broad research and selective investment decisions. The line does not promise better returns.
-
-These examples teach judgment, not a formula. Do not convert the Ralsonics line into "Investment research for the details that decide everything." Start again from Moneybee's work and the visitor's decision. Reusing a sentence with one noun changed is precisely the stock language to avoid.
-
-Aryan cited "Your complete platform for the web," "frontend cloud for agents," "Code at the speed of thought," and "Think different" as examples of concentrated positioning. Treat them as references supplied in the conversation, not a verified list of current brand headlines. They make different choices about category, audience, experience, and belief. A familiar brand can leave things implicit that an unfamiliar company needs to state. Borrow that judgment, not the syntax or permission to be vague.
-
-### Learn from the rejected titles
-
-| Rejected example | What went wrong |
-| --- | --- |
-| "A wide field. A narrow portfolio. Selection with exactitude." | Clipped symmetry and a formal word simulate significance. There is no convincing thought behind the rhythm. |
-| "The work begins where clean ends." | A manufactured paradox makes the visitor decode a slogan instead of understand the company. |
-| "We began with fetal monitors." | A historical fact may belong in the story without representing the company at the top of an About page. Accuracy alone does not make it a good title. |
-| "Begin with the work." | Too indeterminate for a products page. The visitor is looking at products, not an abstract philosophy. |
-| "The work behind every investment." | Describes conscientiousness without identifying the offer or placing Moneybee meaningfully in the reader's mind. |
-| "The whole market is the starting point." | Captures breadth but leaves out the business. It also makes a scope claim that approximate research counts alone do not establish. |
-| "Most portfolios start with a shortlist. Ours starts with 6,000." | The user liked its direction, but the competitor comparison was unsupported. Preserve the intent without inventing how others work. |
-
-An accurate line can still be dull. An evocative line can still be empty. Assess meaning, feeling, and fitness for the page together. Do not defend a failed title with a paragraph explaining why it supposedly works.
-
-### Infer the preference instead of repeating the vocabulary
-
-When Aryan says "exactitude," infer a preference for words that capture an idea precisely. Do not insert that word into every draft. When he accepts "A window into our process," notice the invitation to look inside. Do not generate ten variations of "window" or force every page into that structure.
-
-Do not fixate on "clean," "process," "portfolio," "details," or any other word from an accepted line. Reconsider the business and the page when a direction fails. However, a category word is not a fixation merely because it recurs. Keep "cleaning" where it tells a new visitor what is sold. Remove repetition that adds no meaning.
-
-Precise vocabulary should add to the accepted idea and emotional effect. Keep the substance of a successful draft while improving its language. Do not replace it with a shorter slogan, a grander metaphor, or a more technical summary unless that is the requested change.
-
-### Let emotion come from understanding
-
-The aim is recognition, curiosity, or confidence appropriate to the reader's situation. The title should suggest that the company understands what matters to them. This requires business understanding before wordplay. "Aura" is not an instruction to add cosmic imagery, exaggerated stakes, or mysterious fragments.
-
-Keep learning from the attention, specificity, and emotional development discussed in the writer references above. Do not turn an essay's pacing into a homepage monologue, or claim those writers would endorse the copy. A simple image such as a window can invite someone in; an image added only to sound profound obscures the message. Judge its contribution in context.
-
-### Review the title in place
-
-Before presenting copy, check the actual heading beside its image, label, body, and action. Ask yourself:
-
-- Can a first-time visitor understand the business at the point where the page needs to establish it?
-- What position or invitation does the title offer beyond naming the category?
-- What should the reader feel, and which words help that feeling arise?
-- Does the supporting copy provide evidence or useful detail instead of paraphrasing the title?
-- Have I preserved the user's accepted direction while applying the new correction?
-
-These checks belong in the writing process. Do not publish them as UI subtitles. A strong title does not remove the need for useful explanation, and a strong body does not rescue an empty title. Keep necessary category terms, qualifications, and disclosures when compressing to fit a layout.
-
-Present the strongest candidate first. Offer alternatives only when they represent meaningfully different choices or the user asks for them. Do not overwhelm the user with synonym variations or another explanation of why a line they rejected is good.
-
-## Language that gives a feeling a form
-
-Aryan supplied these lines as positive examples of writing he responds to. Preserve them as taste references. Their authorship and exact published wording have not been verified; do not assign authors or present them as original work by the agent.
-
-> A mind that is stretched by new experience can never go back to its old dimensions.
-
-> only unfinished souls have an ability to create
-
-> a person who thinks all the time , has nothing to think about but thoughts.
-
-> the greatest distance in the universe is between my eyes and hers.
-
-These examples make an experience recognizable through a particular relationship between ideas. The first gives personal change an irreversible physical shape. The second suggests that incompleteness can motivate creation. The third makes thought turn back on itself until it excludes experience. The fourth measures emotional separation between two people in the language of physical distance.
-
-The ordinary words matter as much as the unusual ones. "My eyes and hers" makes an immense distance intimate. Replacing it with "interpersonal alienation" would lose the feeling despite sounding more formal. Exactitude can mean finding an ordinary phrase that someone recognizes immediately.
-
-### Write the observation before trying to make it beautiful
-
-Start with something worth noticing about this subject. Identify what someone experiences, what seems contradictory about it, or what changes when they understand it differently. Then choose the wording that lets the reader recognize that experience. An image can express a relationship more fully than a literal label. Keep it when it does that work.
-
-If all that remains after paraphrasing a line is "this is good," "this is deep," or "this matters," the sentence needs a better thought. Do not assemble profundity by combining words such as "soul," "universe," "silence," and "infinity." Do not require a paradox or a final twist in every sentence. Emotional writing can also be a quiet observation with nothing withheld.
-
-### Further examples to consider
-
-The lines below were drafted by the agent for this exercise. They are proposals, not quotations from named writers or examples Aryan has already approved.
-
-- "I learned how much I had changed when I got what I used to want."
-- "The first draft was the first time I heard what I was trying to say."
-- "I had rehearsed the conversation so often that I forgot she hadn't been there."
-- "She spoke about her childhood, and for a moment I missed a place I had never been."
-- "We kept revising the goodbye until it became another evening together."
-- "I still know which stair to skip in a house I no longer belong to."
-
-Notice the different subjects and feelings: changed desires, discovery through making, overthinking, closeness, reluctance to part, and remembered belonging. Do not infer that emotional writing must always be melancholy, romantic, or about memory. Wonder, affection, amusement, and intellectual recognition also belong when the subject supports them.
-
-### Apply this taste where it belongs
-
-These references expand the emotional range of the voice. They do not make every piece of copy an aphorism. Keep the existing requirements for business positioning, useful explanation, and restraint in UI. A product label may need only a product name. A homepage still needs to establish what the business offers. A story may have room for an observation that leaves something unspoken.
-
-Use the examples to understand why the language moves Aryan. Do not substitute company nouns into them, invent personal experiences for a brand, or reuse them as decorative subtitles. Figurative language belongs when it expresses a real idea or feeling appropriate to the context. Remove it when its only contribution is making the writer sound literary.
+Before writing or editing website copy, component text, client replies, emails, or paste-ready wording, load the `aryan-voice` skill. This includes copy written during UI implementation. If skill discovery misses it, read `/Users/blank/dotfiles/skills/skills/aryan-voice/SKILL.md`. Follow its voice guide and relevant examples before drafting.
```

## rules/core/aryan-voice.grok.md

```diff
--- rules/core/aryan-voice.grok.md before
+++ rules/core/aryan-voice.grok.md after
@@ -1,3 +1,3 @@
 # Aryan voice
 
-For paste-ready replies and client notes, sound like Aryan: practical, semi-casual, implementation-minded. Use "from what I understand", "if that's the case", "yes, this makes sense" when they fit. Keep points. Translate vague comments into product, CRM, API, compliance, ownership, or approval decisions. Prefer "we can" and "we should". If it sounds like a consultant deck, simplify.
+Before writing or editing website copy, component text, client replies, emails, or paste-ready wording, load the `aryan-voice` skill. This includes copy written during UI implementation. If skill discovery misses it, read `/Users/blank/dotfiles/skills/skills/aryan-voice/SKILL.md`. Follow its voice guide and relevant examples before drafting.
```

## skills/aryan-voice/SKILL.md

```diff
--- skills/aryan-voice/SKILL.md before
+++ skills/aryan-voice/SKILL.md after
@@ -0,0 +1,30 @@
+---
+name: aryan-voice
+description: Write or refine website copy, component text, client replies, emails, and paste-ready wording in Aryan's voice. Use when choosing words for a page or UI, interpreting client notes, or matching Aryan's writing taste, including copy written during implementation.
+---
+
+# Aryan voice
+
+Write words chosen for the actual business, reader, and situation. Aryan prefers practical, semi-casual client communication and website copy with a clear offer, exact detail, and feeling that comes from understanding the subject.
+
+## Read before drafting
+
+Read [the voice guide](references/voice-guide.md) for the relevant task. It preserves Aryan's existing guidance, accepted and rejected titles, client reply examples, and literary taste references.
+
+- For replies, emails, and client notes, read the opening sections through "Self-check". Keep the source's numbered points and translate vague comments into concrete decisions.
+- For website or component copy, read from "Decide whether the UI needs words" through the end. Also read the matching examples in [50 website and component examples](references/website-component-examples.md). Its index groups examples by purpose.
+- For personal or expressive writing, read "Choose the exact word" and "Language that gives a feeling a form". The proposed lines there are not attributed quotations.
+
+The 50 examples are actual visible text inside the BLANK repository's pages and components. They come from JSX text and the content strings JSX renders. Use the quoted words as taste references, with the short notes explaining the particular choice worth learning.
+
+## Apply the voice
+
+Establish who is speaking, who is listening, what is offered, and why this line needs to exist. A homepage must identify an unfamiliar business. A service description should explain what happens and why the customer cares. A conventional control may need only its familiar label.
+
+Preserve an accepted direction when refining wording. Match the reference's specificity and fitness for its subject rather than recycling its syntax or replacing a company noun. A restaurant, a playful studio, and an engineering product have different reasons to speak.
+
+Use named objects, actions, and consequences. Keep an unusual word when it means the precise thing intended. Let an image carry a real relationship or feeling; remove it when it only makes the writer sound literary. Do not import a demo's claims, experience, numbers, or testimonials into another business.
+
+Remove subtitles that repeat the visible UI. Do not fill empty space with copy. Keep instructions, errors, disclosures, and accessibility text that help someone act. Avoid em dashes, manufactured paradoxes, clipped slogan sequences, and generic claims of quality.
+
+Read the draft beside its heading, image, body, and action when that context is available. Present the strongest candidate first. Offer alternatives only when they represent different positions or the user asks for them. Do not expose the writing checklist as UI copy.
```

## skills/aryan-voice/references/website-component-examples.md

```diff
--- skills/aryan-voice/references/website-component-examples.md before
+++ skills/aryan-voice/references/website-component-examples.md after
@@ -0,0 +1,429 @@
+# Repository examples for website and component copy
+
+Aryan asked for 50 examples from the BLANK repository to guide future website and component writing. This selection records that preference. These are the words visitors see in rendered pages and components, taken from JSX text and content strings rendered by JSX. They are not code comments, registry descriptions, implementation documentation, or newly written alternatives. The selection does not imply that Aryan individually approved every line.
+
+Read the relevant examples before drafting. Match the purpose of the passage, the specificity, and the relationship with the reader. Do not substitute a company name into an example, imitate its sentence structure by habit, or add a caption where the UI needs none. Conventional controls still use conventional labels.
+
+These pages have different voices. A playful studio, a restaurant, an architecture practice, and an engineering product should not all sound alike. Learn how the wording fits the subject. Use physical detail for sensory work, concrete tasks for technical work, and humor only where the relationship allows it. Preserve the existing rules on business positioning, restraint, and verified claims.
+
+Source snapshot: `/Users/blank/Desktop/CREATE/compronents`, selected on 2026-09-14. Quotes retain the repository wording, with JSX markup removed, HTML entities decoded, and whitespace joined. Entries marked as excerpts quote a contiguous portion of a longer passage. Source links identify the local file and line. Repository presence verifies the wording only, not a demo brand's history, numbers, credentials, client results, or the original authorship of imported copy. Never carry those claims into another business without evidence.
+
+## Find an example
+
+| Need | Examples |
+| --- | --- |
+| Studio positioning, AI judgment, process, contact | 01 to 10 |
+| Engineering product, customer frustration, origin story | 11 to 18 |
+| Architecture, materials, sensory descriptions | 19 to 23 |
+| Dining and reservations | 24 to 25 |
+| Film practice and archive | 26 to 27 |
+| Playful studio and client reviews | 28 to 30 |
+| Service tabs with methods and consequences | 31 to 34 |
+| Educational cards | 35 to 38 |
+| Cinematography and image-led text | 39 to 43 |
+| Project cards | 44 to 47 |
+| Design principles in cards | 48 to 50 |
+
+### Website examples
+
+#### 01. Hero supporting line
+
+> A design & engineering practice for interface builders
+
+Name the work and the audience beside an expressive headline.
+
+Source: [src/registry/pixelgrid-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/pixelgrid-studio-page/index.tsx:272).
+
+#### 02. Studio working practice
+
+> We work much the same way. One team, one set of eyes, and nothing left to run on its own.
+
+Explain how the team works in words a client can picture.
+
+Source: [src/registry/pixelgrid-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/pixelgrid-studio-page/index.tsx:351).
+
+#### 03. Essay on AI production
+
+> The tools are very good now, and everyone has the same ones. A first draft, ten variations, working code: what used to take a week takes an afternoon.
+
+Use familiar deliverables to explain a change. Time comparisons need evidence in a new context.
+
+Source: [src/registry/pixelgrid-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/pixelgrid-studio-page/index.tsx:368).
+
+#### 04. Essay on creative judgment
+
+> Which is why volume stopped being the hard part. Point a model at a blank page and it hands back the average of everything it has already seen. Competent enough, and instantly forgettable.
+
+Give the brand a specific judgment, with a recognizable outcome behind it.
+
+Source: [src/registry/pixelgrid-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/pixelgrid-studio-page/index.tsx:373).
+
+#### 05. Generate process step
+
+> It rarely lands first try, so we curate and keep tuning the prompt and the inputs until it does.
+
+Admit the iteration and explain what the team changes.
+
+Source: [src/registry/pixelgrid-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/pixelgrid-studio-page/index.tsx:448).
+
+#### 06. Refine process step
+
+> We keep what's working, fix what isn't, and take it the rest of the way.
+
+Use ordinary verbs to make a process legible.
+
+Source: [src/registry/pixelgrid-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/pixelgrid-studio-page/index.tsx:454).
+
+#### 07. Scale process step
+
+> Once something works, it becomes a system we can reuse.
+
+Make reuse conditional on having something that works.
+
+Source: [src/registry/pixelgrid-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/pixelgrid-studio-page/index.tsx:460).
+
+#### 08. Advisory service
+
+> We know where the line is, and we'll happily talk you out of the AI idea that's going to embarrass you in six months.
+
+Express care through a decision the adviser will help the client avoid.
+
+Source: [src/registry/pixelgrid-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/pixelgrid-studio-page/index.tsx:606).
+
+#### 09. Lab section title
+
+> The tools are everywhere. The judgment isn't.
+
+State the particular distinction the surrounding work supports. Do not reuse the sentence structure as a slogan formula.
+
+Source: [src/registry/pixelgrid-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/pixelgrid-studio-page/index.tsx:368).
+
+#### 10. Contact section
+
+> We're a small, remote team scattered across a few time zones, so the odds are decent someone's awake near you. Small by design, always happiest with a good problem to solve.
+
+Let a real team detail make the invitation warmer.
+
+Source: [src/registry/pixelgrid-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/pixelgrid-studio-page/index.tsx:675).
+
+#### 11. Hero audience
+
+> For engineers who work in Next.js and Sanity.
+
+A direct audience label can do more than another persuasive sentence.
+
+Source: [src/registry/content-architecture-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/content-architecture-page/index.tsx:766).
+
+#### 12. Problem section title
+
+> The page builder alone costs you days. Every single time.
+
+Name the recurring job and its cost. Support the frequency claim before using it elsewhere.
+
+Source: [src/registry/content-architecture-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/content-architecture-page/index.tsx:810).
+
+#### 13. Problem section body
+
+> It's never the easy stuff that hurts. It's the page builder, modeled from scratch again. Draft mode and live preview, wired up and subtly broken again. The cache bug where published content goes stale and the client swears you shipped something wrong. A Studio structure your editors actually understand, instead of one they email you about.
+
+Trace a technical failure into the client conversation it creates.
+
+Source: [src/registry/content-architecture-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/content-architecture-page/index.tsx:817).
+
+#### 14. Problem section closing
+
+> This is the part nobody quotes for and everybody rebuilds. Days gone before the real work starts.
+
+Name the commercial frustration behind repeated implementation work.
+
+Source: [src/registry/content-architecture-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/content-architecture-page/index.tsx:825).
+
+#### 15. Maintainer story
+
+> Every Sanity project I shipped, the first week looked identical. Spin up Next. Wire the Studio. Rewrite the page builder. Rebuild the SEO layer. Re-do the webhook revalidation. Re-style the same contact form for the fourth time.
+
+Let the repeated tasks establish why the product exists. This is the source narrator's experience, not ours to invent.
+
+Source: [src/registry/content-architecture-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/content-architecture-page/index.tsx:1161).
+
+#### 16. Maintainer story cost
+
+> By the time the actual creative work started, 3 days of the budget were gone and the client had not seen a single pixel that mattered.
+
+Connect elapsed time, budget, and what the client can actually see.
+
+Source: [src/registry/content-architecture-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/content-architecture-page/index.tsx:1168).
+
+#### 17. Maintainer story development
+
+> Extracting it started small. One project. Then two. Then ten. Every time something broke in production, the fix went back into the architecture.
+
+Show how repeated use changed the product, with a history that must be true.
+
+Source: [src/registry/content-architecture-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/content-architecture-page/index.tsx:1173).
+
+#### 18. Maintainer continuing practice
+
+> This is still the foundation underneath my client work. Each production lesson goes back into the repository, so the next project begins with a stronger set of decisions.
+
+Explain the mechanism that keeps a product improving.
+
+Source: [src/registry/content-architecture-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/content-architecture-page/index.tsx:1181).
+
+#### 19. Project description
+
+> Arcade Residence is a study in rhythm and light, where colonnades and vaulted thresholds frame daily life with quiet grandeur.
+
+Give the feeling physical objects, colonnades and thresholds, that belong to the project.
+
+Source: [src/registry/interior-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/interior-studio-page/index.tsx:2977).
+
+#### 20. Architectural story
+
+> At Arcade Residence, the sequence of arches creates a measured rhythm that guides movement through the home. Each passage frames daylight differently, shifting the mood as one moves from courtyard to living space.
+
+Describe what the person encounters as they move through the space.
+
+Source: [src/registry/interior-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/interior-studio-page/index.tsx:3038).
+
+#### 21. Material story excerpt
+
+> Materials were chosen for their quiet permanence: pale stone, lime plaster, and timber accents.
+
+Support an abstract quality with named materials.
+
+Source: [src/registry/interior-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/interior-studio-page/index.tsx:3045).
+
+#### 22. Sensory design rationale
+
+> Every choice within the residence was guided by sensory experience. The aim was not only to frame views but to shape how sound, touch, and temperature are felt as one moves through the home.
+
+Explain the experience beyond what a photograph can show.
+
+Source: [src/registry/interior-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/interior-studio-page/index.tsx:3113).
+
+#### 23. Work section title
+
+> A selection of recent studies and completed spaces
+
+Tell the visitor what is included without inflating its significance.
+
+Source: [src/registry/interior-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/interior-studio-page/index.tsx:2566).
+
+#### 24. Dining invitation
+
+> Settle into a space where the pace softens and each course arrives with quiet intention.
+
+Express hospitality through the pace of an evening.
+
+Source: [src/registry/dining-room-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/dining-room-page/index.tsx:1702).
+
+#### 25. Reservation introduction
+
+> Reserve your place for an evening of attentive service, thoughtful plates, and an atmosphere made to linger in.
+
+Put the action first, then the experience the guest is choosing.
+
+Source: [src/registry/dining-room-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/dining-room-page/index.tsx:2741).
+
+#### 26. Archive description
+
+> A living record of projects, people, and process.
+
+Describe an archive by what it contains and why someone might return.
+
+Source: [src/registry/film-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/film-studio-page/index.tsx:816).
+
+#### 27. Filmmaking practice excerpt
+
+> We set lights until the shadows fall in the right place. We cut until rhythm appears.
+
+Show craft through the adjustments people make, rather than calling the team meticulous.
+
+Source: [src/registry/film-studio-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/film-studio-page/index.tsx:1628).
+
+#### 28. Studio introduction
+
+> We build visuals, stories, and systems for people who like their creativity a little unpredictable.
+
+Name the offer and the kind of client it suits.
+
+Source: [src/registry/polite-chaos-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/polite-chaos-page/index.tsx:117).
+
+#### 29. Work introduction
+
+> From motion to concept, pieces born from quiet sketches, late nights, and just the right amount of chaos.
+
+Let evidence of making give a playful studio its tone. Do not turn late nights into a generic virtue.
+
+Source: [src/registry/polite-chaos-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/polite-chaos-page/index.tsx:144).
+
+#### 30. Client review introduction
+
+> Unfiltered thoughts from the people who survived our creative process. Or at least that is what they told us.
+
+Use self-directed humor where the brand and relationship support it, never as the default tone for serious services.
+
+Source: [src/registry/polite-chaos-page/index.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/polite-chaos-page/index.tsx:166).
+
+### Component examples
+
+#### 31. Spatial Optimization service tab
+
+> We measure how a room is actually used before we move a single wall, so the plan you approve is the plan you end up living in.
+
+Tie the method to the exact reassurance the client needs.
+
+Source: [src/registry/switch-on-hover-tabs.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/switch-on-hover-tabs.tsx:90).
+
+#### 32. Renovation Guidance service tab
+
+> Drawings, permits, and trades held on one schedule, with a single point of contact from demolition through the final walkthrough.
+
+Explain what coordination includes and who the client deals with.
+
+Source: [src/registry/switch-on-hover-tabs.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/switch-on-hover-tabs.tsx:95).
+
+#### 33. Material Sourcing service tab
+
+> Stone, timber, and hardware chosen against the real light in the room, sampled on site, and priced before anything is ordered.
+
+Make care tangible through sampling, real conditions, and price visibility.
+
+Source: [src/registry/switch-on-hover-tabs.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/switch-on-hover-tabs.tsx:100).
+
+#### 34. Site Supervision service tab
+
+> Weekly checks against the drawing set, photographed and logged, so a problem surfaces while it is still cheap to fix.
+
+State the check, its evidence, and the consequence of catching a problem early.
+
+Source: [src/registry/switch-on-hover-tabs.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/switch-on-hover-tabs.tsx:105).
+
+#### 35. Working Knowledge card
+
+> Frameworks, principles, and models you can apply to your interface work right away, from spacing systems to the way state is designed.
+
+Tell the reader what the learning covers and where they can use it.
+
+Source: [src/registry/fanned-card-deck.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/fanned-card-deck.tsx:521).
+
+#### 36. Practical Demonstration card
+
+> Detailed walkthroughs of building interfaces, spotting the real opportunities, and refining a screen until every part holds together.
+
+Describe what happens in a lesson rather than promising mastery.
+
+Source: [src/registry/fanned-card-deck.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/fanned-card-deck.tsx:533).
+
+#### 37. Collaborating with AI card
+
+> Repeatable, specific methods for working with AI to get exacting results, covering Claude Code and how to structure prompts for real components.
+
+Name the tool and task that make a broad topic concrete.
+
+Source: [src/registry/fanned-card-deck.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/fanned-card-deck.tsx:545).
+
+#### 38. Means & Methods card
+
+> Small techniques for daily work: alignment, rhythm, and the assembly details that separate a good interface from a great one.
+
+Give the small details names so the reader knows what the card offers.
+
+Source: [src/registry/fanned-card-deck.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/fanned-card-deck.tsx:557).
+
+#### 39. Cinematography opening heading
+
+> Framed in tungsten and shadows, every shot holds its own deliberate tension.
+
+Use a relevant lighting material to establish the visual character.
+
+Source: [src/registry/block-reveal-text.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/block-reveal-text.tsx:48).
+
+#### 40. Cinematography body
+
+> This is cinematography in its raw form with practical lamps, soft falloff, and the presence of grain that fills each corner of the frame. Every room functions as a set and every posture becomes a composition. Light moves across furniture and faces, shaping scenes with a natural sense of depth.
+
+Build the description out of what can be seen in the frame.
+
+Source: [src/registry/block-reveal-text.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/block-reveal-text.tsx:54).
+
+#### 41. Still photography heading
+
+> Still frames with bold contrast and lighting choices that embrace imperfection.
+
+Describe a chosen visual treatment without claiming technical perfection.
+
+Source: [src/registry/block-reveal-text.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/block-reveal-text.tsx:59).
+
+#### 42. Camera movement body
+
+> The camera settles into long takes and patient movement. Colors stay unrefined and shadows turn into texture. The image waits for action instead of chasing it. Every frame forms a clear visual language built through restraint.
+
+Let sentence pace support the patient movement being described.
+
+Source: [src/registry/block-reveal-text.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/block-reveal-text.tsx:66).
+
+#### 43. Cinematography closing heading
+
+> Cinematography thrives in the details from the grain to the falloff to the glow.
+
+Use the vocabulary of the actual medium, with the images supplying the evidence.
+
+Source: [src/registry/block-reveal-text.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/block-reveal-text.tsx:71).
+
+#### 44. Inked project card
+
+> A typographic launch experience built around a single ink-bleed transition and a lot of restraint.
+
+Identify the one design decision that distinguishes the project.
+
+Source: [src/registry/portfolio-page.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/portfolio-page.tsx:55).
+
+#### 45. Chromatic project card
+
+> A color-driven product site where every section owns its own palette and the scroll blends between them.
+
+Describe the visible behavior in one sentence.
+
+Source: [src/registry/portfolio-page.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/portfolio-page.tsx:63).
+
+#### 46. Stellar project card
+
+> An immersive scroll piece about orbital mechanics, paced entirely by a pinned timeline.
+
+Connect subject, interaction, and pacing without listing implementation details unrelated to the visitor.
+
+Source: [src/registry/portfolio-page.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/portfolio-page.tsx:79).
+
+#### 47. Byte project card
+
+> A developer landing page that treats the terminal as the hero and the cursor as the narrator.
+
+Use an image that corresponds to actual elements and their roles on the page.
+
+Source: [src/registry/portfolio-page.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/portfolio-page.tsx:87).
+
+#### 48. Modularity card
+
+> Every element is built to snap into place. We design modular systems where clarity, structure, and reuse come first, with no clutter and no excess.
+
+Make a system quality understandable through how its parts fit together.
+
+Source: [src/registry/sticky-stack-cards.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/sticky-stack-cards.tsx:43).
+
+#### 49. Precision card excerpt
+
+> We work with intention, aligning pixels, calibrating contrast, and obsessing over every edge until it just feels right.
+
+Follow a claim of care with the adjustments the designer makes.
+
+Source: [src/registry/sticky-stack-cards.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/sticky-stack-cards.tsx:57).
+
+#### 50. Character card
+
+> Interfaces should have personality. We embed small moments of play and irregularity to bring warmth, charm, and a human feel to the digital.
+
+Explain which design choices create the feeling. Use this where the examples visibly support the claim.
+
+Source: [src/registry/sticky-stack-cards.tsx](/Users/blank/Desktop/CREATE/compronents/src/registry/sticky-stack-cards.tsx:64).
```

## Preserved guide

[Open the unchanged voice guide](/Users/blank/dotfiles/skills/skills/aryan-voice/references/voice-guide.md). Verified byte-for-byte against the pre-edit source.
