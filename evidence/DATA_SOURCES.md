# Training-source attribution and modification notices

These are sources used for Vej's local training and evaluation transformations.
The model package contains no source dataset rows. Dataset text retains its
original terms; Apache-2.0 applies to Vej code and model adaptations, not to those
texts. No source author endorses Vej. Source-specific redistribution review is
still required before distributing a combined or adapted corpus.

| Source and attribution | Original terms | Pinned acquisition |
|---|---|---|
| NVIDIA, Wang et al., [HelpSteer](https://huggingface.co/datasets/nvidia/HelpSteer), [paper](https://arxiv.org/abs/2311.09528) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `3ca5d59c1bc1080af195b4254e7407db60b6f450` |
| NVIDIA, Wang et al., [HelpSteer2](https://huggingface.co/datasets/nvidia/HelpSteer2), [paper](https://arxiv.org/abs/2406.08673) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `990b2711a36180dd19d9c94b8627844866f8982a` |
| Google, Rastogi et al., [Schema-Guided Dialogue](https://github.com/google-research-datasets/dstc8-schema-guided-dialogue), [paper](https://arxiv.org/abs/1909.05855) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | `e852981ae34990f4358979625854259302feaa78` |
| Williams, Nangia and Bowman, [MultiNLI 1.0](https://cims.nyu.edu/~sbowman/multinli/), [paper](https://aclanthology.org/N18-1101/) | Publisher-described OANC terms for selected nonfiction; fiction excluded | Original release 1.0 |
| Bowman et al., [SNLI 1.0](https://nlp.stanford.edu/projects/snli/), [paper](https://aclanthology.org/D15-1075/) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Original release 1.0 |
| Anthropic, Bai et al., [HH-RLHF](https://huggingface.co/datasets/Anthropic/hh-rlhf), [paper](https://arxiv.org/abs/2204.05862) | [MIT license](https://github.com/anthropics/hh-rlhf/blob/master/LICENSE) | `09be8c5bbc57cb3887f3a9732ad6aa7ec602a1fa`, `c72f5cee8eb7b4d2ea5617657f4430d5e333af07` |
| PolyAI, Casanueva et al., [BANKING77](https://github.com/PolyAI-LDN/task-specific-datasets), [paper](https://arxiv.org/abs/2003.04807) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `57ec275d8078af65b7731c2a98be812d844a6d6b` |
| Liu, Swayamdipta, Smith and Choi, [WANLI](https://huggingface.co/datasets/alisawuffles/WANLI), [paper](https://aclanthology.org/2022.findings-emnlp.508/) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `61c95318fd71c55b6ba355d76253254615f387ec` |
| Larson et al., [CLINC150/OOS](https://github.com/clinc/oos-eval), [paper](https://aclanthology.org/D19-1131/) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | `828f8093932c8fe6ca7936c3d2e52903b1c523de` |
| Vej authors, original policy workflows | Apache-2.0 | Frozen Vej workflow role locks, recorded in the source experiment history |

## Changes made by Vej

- HelpSteer1/2: select responses, preserve ordinal human ratings, and construct
  independent native Score rubric levels. HelpSteer2 coherence and helpfulness
  and HelpSteer1 helpfulness remain separate supervision.
- SGD: select grouped training-source dialogues and project service intent,
  categorical argument state and required-input completeness into Choice/Noul
  questions. Preserve supplied annotations; quarantine unsupported annotations.
  Simulator-guided human paraphrases are not real-world tool-permission labels.
- MultiNLI/SNLI/WANLI: screen source examples and groups, retain original NLI
  labels and write native relation questions. MultiNLI fiction is excluded.
  WANLI has model-generated text with human filtering/annotations.
- HH-RLHF: select preference pairs and create native comparative decisions;
  helpfulness and harmlessness are separate. Preference is not objective truth.
- BANKING77/CLINC: select utterances and construct semantic intent catalogs and
  native decisions from their original intent labels.
- Vej workflows: author policy worlds, conditions and native questions; these
  are synthetic task-policy examples, not observations of deployed performance.

All sources undergo deterministic selection, schema conversion, grouping,
role preservation and length screening as described in DATASET_CARD.md. Human
annotations are not individually re-adjudicated. Train/validation/test are Vej
roles derived from acquired publisher training payloads, not a relabeling of
publisher official test rows as training. Exact split file hashes are published
in DATASET_CARD.md. Conceptual leakage and backbone exposure remain uncertain.
