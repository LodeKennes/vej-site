<p><img src="assets/brand/logo.svg" width="160" alt="Vej"></p>

# State in, probabilities out.

Vej is a 2B text model that returns probabilities directly. Describe a situation and the possible outcomes; Vej assigns a probability to each. Route requests, check for missing information, or score a response against a rubric. Your code decides what happens next.

[Explore Vej](https://itsvej.com/) · [Run locally](https://itsvej.com/model/#runtime) · [Evaluation](https://itsvej.com/evaluation/)

## Why Vej?

Choose Vej when running the model yourself matters.

- **Keep inputs local.** Inference runs on your machine, without a hosted model API.
- **Apache-2.0 code and model adaptations.** Training sources and evaluation
  methods are documented. Source and weights remain access-restricted.
- **One consumer GPU.** Trained and evaluated on a single RX 9070 XT with 16 GB
  VRAM. The checkpoint is about 3.6 GiB on disk. CPU inference works, but is slow.

## Vej and Jev

Accuracy on the same 14,286 test decisions:

| Task | Vej alpha2 | Jev 1.13¹ |
| --- | ---: | ---: |
| Choose an outcome · Choice | **89.22%** | 83.07% |
| Assess a statement · Noul | 91.71% | **93.65%** |
| Rate against a rubric · Score | **51.62%** | 44.20% |
| **Overall** | **76.60%** | 71.76% |

¹ Jev uses the documented post-launch rounding adjustment. This is one test of dialogue decisions and response ratings, not Jev’s official benchmark. Score requires an exact rubric-level match. [Method, strict results and limitations →](https://itsvej.com/evaluation/#jev)

## Status

**Research alpha.** Text decisions; an untrained vision input path also exists. No vision decision quality has been measured. Source and weights are not yet publicly available; authorized users can follow the [local setup](https://itsvej.com/model/#runtime). The [model card](https://itsvej.com/model/) covers access and runtime support.

Tool reliability remains limited: 30/48 harder development cases passed. Keep execution behind your own policy checks; probabilities are not permission to act.

[Training data](https://itsvej.com/evaluation/#sources) · [Licensing](https://itsvej.com/licenses/)

## SDK compatibility

Use the [text-only Jev/Clef adapter](docs/CLEF.md) to call a local Vej checkpoint
with the official Jev (TypeSafe) Python SDK or Cloudflare SDK.
