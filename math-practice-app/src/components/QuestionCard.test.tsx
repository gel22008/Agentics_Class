import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildQuestion } from '../services/questionGenerator'
import QuestionCard, { MATCHES_MESSAGE, RECHECK_MESSAGE } from './QuestionCard'

// 8 × 7 with fixed choices so tests are predictable.
const question = {
  ...buildQuestion('multiplication', 'intermediate', 8, 7),
  choices: [54, 56, 48, 63],
}

function renderCard(props: Partial<Parameters<typeof QuestionCard>[0]> = {}) {
  const onResult = vi.fn()
  render(
    <QuestionCard
      question={question}
      questionNumber={3}
      totalQuestions={10}
      animate={false}
      showExplanation
      onResult={onResult}
      {...props}
    />,
  )
  return { onResult, user: userEvent.setup() }
}

const answerButton = (value: number) =>
  screen.getByRole('button', { name: new RegExp(`^Answer \\d: ${value}`) })

describe('QuestionCard front', () => {
  it('shows the problem, four answers and the question number', () => {
    renderCard()
    expect(screen.getByRole('heading', { name: /8 × 7/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Answer \d/ })).toHaveLength(4)
    expect(screen.getAllByText('Question 3 of 10')[0]).toBeInTheDocument()
  })

  it('shows only the question number in continuous practice', () => {
    renderCard({ totalQuestions: null, questionNumber: 7 })
    expect(screen.getAllByText('Question 7')[0]).toBeInTheDocument()
  })

  it('keeps Flip Card disabled until an answer is selected', async () => {
    const { user } = renderCard()
    const flip = screen.getByRole('button', { name: /Flip Card/ })
    expect(flip).toBeDisabled()
    await user.click(answerButton(54))
    expect(flip).toBeEnabled()
  })

  it('highlights the selected answer and allows changing it before flipping', async () => {
    const { user } = renderCard()
    await user.click(answerButton(54))
    expect(answerButton(54)).toHaveAttribute('aria-pressed', 'true')
    await user.click(answerButton(56))
    expect(answerButton(56)).toHaveAttribute('aria-pressed', 'true')
    expect(answerButton(54)).toHaveAttribute('aria-pressed', 'false')
  })

  it('selects answers with number keys 1–4', async () => {
    const { user } = renderCard()
    await user.keyboard('2')
    expect(answerButton(56)).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('4')
    expect(answerButton(63)).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('QuestionCard back', () => {
  it('reveals the correct answer, the chosen answer and the explanation after flipping', async () => {
    const { user } = renderCard()
    await user.click(answerButton(54))
    await user.click(screen.getByRole('button', { name: /Flip Card/ }))

    expect(screen.getByText('Your answer').nextElementSibling).toHaveTextContent('54')
    expect(screen.getByText('Correct answer').nextElementSibling).toHaveTextContent('56')
    expect(screen.getByText('8 groups of 7 make 56.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /I Got It Right/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /I Got It Wrong/ })).toBeInTheDocument()
  })

  it('hides the explanation when the setting is off', async () => {
    const { user } = renderCard({ showExplanation: false })
    await user.click(answerButton(56))
    await user.click(screen.getByRole('button', { name: /Flip Card/ }))
    expect(screen.queryByText('8 groups of 7 make 56.')).not.toBeInTheDocument()
  })

  it('does not allow changing the answer after flipping', async () => {
    const { user } = renderCard()
    await user.click(answerButton(54))
    await user.click(screen.getByRole('button', { name: /Flip Card/ }))
    await user.keyboard('2')
    expect(screen.getByText('Your answer').nextElementSibling).toHaveTextContent('54')
  })

  it('records a correct answer reported as right', async () => {
    const { user, onResult } = renderCard()
    await user.click(answerButton(56))
    await user.click(screen.getByRole('button', { name: /Flip Card/ }))
    await user.click(screen.getByRole('button', { name: /I Got It Right/ }))
    expect(onResult).toHaveBeenCalledWith({ selectedAnswer: 56, selfReportedCorrect: true })
  })

  it('records a wrong answer reported as wrong', async () => {
    const { user, onResult } = renderCard()
    await user.click(answerButton(54))
    await user.click(screen.getByRole('button', { name: /Flip Card/ }))
    await user.click(screen.getByRole('button', { name: /I Got It Wrong/ }))
    expect(onResult).toHaveBeenCalledWith({ selectedAnswer: 54, selfReportedCorrect: false })
  })

  it('gently asks to recheck before accepting a wrong answer reported as right', async () => {
    const { user, onResult } = renderCard()
    await user.click(answerButton(54))
    await user.click(screen.getByRole('button', { name: /Flip Card/ }))

    await user.click(screen.getByRole('button', { name: /I Got It Right/ }))
    expect(onResult).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(RECHECK_MESSAGE)

    // If they still insist, let them.
    await user.click(screen.getByRole('button', { name: /I Got It Right/ }))
    expect(onResult).toHaveBeenCalledWith({ selectedAnswer: 54, selfReportedCorrect: true })
  })

  it('gently points out a correct answer reported as wrong, then accepts a second tap', async () => {
    const { user, onResult } = renderCard()
    await user.click(answerButton(56))
    await user.click(screen.getByRole('button', { name: /Flip Card/ }))

    await user.click(screen.getByRole('button', { name: /I Got It Wrong/ }))
    expect(onResult).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(MATCHES_MESSAGE)
    expect(screen.getByRole('alert')).toHaveTextContent(/tap it again/)

    await user.click(screen.getByRole('button', { name: /I Got It Wrong/ }))
    expect(onResult).toHaveBeenCalledWith({ selectedAnswer: 56, selfReportedCorrect: false })
  })

  it('records only one result per card', async () => {
    const { user, onResult } = renderCard()
    await user.click(answerButton(56))
    await user.click(screen.getByRole('button', { name: /Flip Card/ }))
    await user.click(screen.getByRole('button', { name: /I Got It Right/ }))
    expect(screen.getByRole('button', { name: /I Got It Right/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /I Got It Wrong/ })).toBeDisabled()
    expect(onResult).toHaveBeenCalledTimes(1)
  })

  it('works the same with the flip animation turned on', async () => {
    const { user, onResult } = renderCard({ animate: true })
    await user.click(answerButton(56))
    await user.click(screen.getByRole('button', { name: /Flip Card/ }))
    await user.click(screen.getByRole('button', { name: /I Got It Right/ }))
    expect(onResult).toHaveBeenCalledTimes(1)
  })
})
