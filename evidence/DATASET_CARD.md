# Vej native expansion r5 — dataset documentation

This card documents the training corpus; it is not a claim that raw rows have
been licensed as a single redistributable dataset or uploaded to Hugging Face.
Release status: provenance and statistics ready; raw distribution held pending
source-specific terms/content review and portable reconstruction recipe.

## Composition and splits

| Original source | Train | Validation | Test |
|---|---:|---:|---:|
| WANLI | 6,144 | 1,024 | 0 |
| CLINC150 | 7,424 | 1,024 | 0 |
| Vej workflows | 3,072 | 384 | 0 |
| HelpSteer2 | 9,000 | 800 | 0 |
| MultiNLI | 30,000 | 9,000 | 0 |
| SNLI | 2,048 | 512 | 0 |
| HH-RLHF | 15,000 | 2,500 | 0 |
| BANKING77 | 3,072 | 384 | 0 |
| HelpSteer1 | 8,000 | 4,000 | 5,000 |
| Schema-Guided Dialogue | 16,242 | 8,944 | 9,286 |
| Total | 100,002 | 28,572 | 14,286 |

Exactly 70/20/10 of 142,860 decisions. Each JSONL record is a native Vej request,
target and provenance, not a chat-completion target. Choice decisions select
among named outcomes; Noul assesses a statement; Score assesses an ordinal
rubric and computes its zero-based expectation externally. Multiple projections
can reuse one source observation, prompt or dialogue. Correlated decisions must
not be interpreted as independent samples.

Train includes 68,719 Choice / 13,771 Noul / 17,512 Score decisions. Validation
has 19,526 / 4,182 / 4,864; test has 6,197 / 3,089 / 5,000. Input-based complexity
strata contain 59,853 straightforward and 40,149 complex train decisions. This
is a construction heuristic, not measured cognitive difficulty.

## Processing and roles

Existing role locks and 34,816 earlier-stage payloads are preserved. Canonical
normalization and dialogue/prompt grouping screen role overlap. MultiNLI fiction
is excluded. HS1/HS2/HH overlap components are joined and new conflicting rows
quarantined. One SGD dialogue with an unsupported categorical annotation is
removed without relabeling. Candidate input lengths fit the 2,048-token limit;
no silent truncation is used. Choice ordering is preserved in r5 serialization.

New test uses HelpSteer1 and SGD Flights/Hotels domain families. SGD validation
uses Events/Services/Homes. The test is source/domain transfer, not an IID copy
of the training mixture. Labels have heterogeneous origins: human intent/NLI
annotations, human subjective ratings/preferences, model-generated and
human-filtered examples, simulator-guided human paraphrases, and authored Vej
policy worlds. Original source labels are not universally re-adjudicated.

## Exposure and appropriate use

Twelve inherited WANLI validation decisions have earlier training exposure.
One historical cross-role component retains 19 inherited train decisions but
has no newly selected held-out examples. One test example was viewed in later
comparator setup; the complete test has now been evaluated and is exposed for
subsequent development. Backbone pretraining overlap is unknown. Duplicate/group
checks do not establish absence of conceptual leakage.

SGD intent and input-completeness supervision is not a label of execution
permission or successful tool operation. Preference labels are not objective
truth; NLI neutral is not false. Potential biases and harmful source text remain.
See DATA_SOURCES.md for original publishers, licenses and attribution. Do not
relicense raw texts under the code/model Apache license.

## Frozen file identities

| File | SHA256 |
|---|---|
| train.jsonl | `4b338fa71c6ec02161ad698c3f3789672897cbed4dd036f6a822f6cc6c38fea6` |
| validation.jsonl | `488de164255ee1e22334a844051b1e837d5f8afa5cc7792159c93a7838ad53bc` |
| test.jsonl | `ac1b11d62e55c6094101f71790f5bcd326b1f32afb91311bb334238036311265` |
| inventory.jsonl | `d5da2a334ddb18230edea913c29307ef26b8bfaccd12247d21786b9f889116d5` |

Source rows are intentionally absent from the model package. A future dataset
release must preserve per-source terms and row-level provenance and include an
executable download/conversion recipe with pinned inputs and role locks.
