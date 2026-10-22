import { useEffect, useState } from 'react'
import { onStorageProblem, type StorageErrorKind } from '../services/storage'

const MESSAGES: Record<Exclude<StorageErrorKind, 'invalid-data'>, string> = {
  unavailable:
    "This browser isn't letting us save your progress. You can keep practicing, but your progress won't be remembered after you leave.",
  full: "Your browser's storage is full, so new progress can't be saved right now. You can keep practicing, or reset your statistics to make room.",
  unknown:
    'Something went wrong while saving your progress. You can keep practicing, but some progress may not be remembered.',
}

const INVALID_DATA_MESSAGE =
  'Some saved practice data could not be read, so that part was reset. Everything else is fine!'

/** Friendly banner shown when saving or loading progress fails. The app keeps working. */
function StorageWarning() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(
    () =>
      onStorageProblem(({ kind }) =>
        setMessage(kind === 'invalid-data' ? INVALID_DATA_MESSAGE : MESSAGES[kind]),
      ),
    [],
  )

  if (!message) return null
  return (
    <div className="storage-warning" role="status">
      <span aria-hidden="true">💾</span>
      <p>{message}</p>
      <button
        type="button"
        className="btn btn--secondary btn--small"
        onClick={() => setMessage(null)}
      >
        OK
      </button>
    </div>
  )
}

export default StorageWarning
