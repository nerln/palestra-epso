# Palestra EPSO AD5

A practice gym for the EPSO open competition for graduate administrators (EPSO/AD/427/26, grade AD5). It runs entirely in the browser, with no account and no server.

**Open it: https://nerln.github.io/palestra-epso/**

The interface and the explanations are in Italian. Part 1 is practised in Italian; the Part 2 questions and the written test are in English, the language the author sits them in.

## What is inside

**Part 1, reasoning tests**

- Verbal reasoning: 60 passages, 20 questions in 35 minutes.
- Numerical reasoning: generated tables and chained calculations, 10 questions in 20 minutes, with the on-screen calculator and notepad only.
- Abstract reasoning: generated figure series, 10 questions in 10 minutes.
- A full simulation that runs the three tests back to back.

**Part 2, EU knowledge, digital skills and the written test**

- EU knowledge: 160 questions across nine topics. A timed test is 30 questions in 40 minutes, pass mark 15.
- Digital skills: 130 questions on the DigComp 2.2 areas. A timed test is 40 questions in 30 minutes, pass mark 20.
- A double simulation that runs both tests and checks the two pass marks.
- Written test: eight case files with a brief and a task, 40 minutes on the clock, word count, draft kept if you leave. You mark your own text on the five criteria EPSO publishes for this test, against a checklist of what the answer needed.

**Feedback**

- Every question has an explanation and the source it was checked against.
- Topics are listed from your weakest, each with a ten-question drill.
- A review mode that brings back only the questions you got wrong last time.
- An estimate of your final ranking score out of 100, using the weights in the notice of competition (35 verbal, 25 EU knowledge, 25 digital skills, 15 written test).

## What it is not

- It is not official and has no link with EPSO or any EU institution.
- The questions are not EPSO questions. They were drafted and cross-checked with AI assistance (Claude) against the sources cited in each explanation. Mistakes may remain: if you find one, please open an issue with the question text.
- The notice does not say how many options a Part 2 question has, or whether wrong answers are penalised. The gym assumes four options and no penalty. The target of about 300 words for the written test and the equal weight of the five criteria are also assumptions.
- The notice of competition and the official sources always prevail.

## Privacy

Results and drafts are stored in your browser's local storage and never leave it. The page sets no cookies and makes no requests to third parties: fonts are served from this repository.

## Run it locally

It is a static site. Serve the folder with any web server:

```
python3 -m http.server 8000
```

## License

Code and questions are released under the [MIT License](LICENSE). The typefaces in `fonts/` are Literata and Public Sans, under the SIL Open Font License 1.1 (see the `OFL-*.txt` files there).
