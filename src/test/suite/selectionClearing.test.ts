import * as assert from 'assert'

/**
 * Replicate HotkeyManager.clearTextSelection logic for testing.
 * The real implementation lives in media/HotkeyManager.js (browser context).
 * We replicate it here to verify the clearing pattern works.
 */
function clearTextSelection(getSelection: () => { removeAllRanges: () => void }) {
  getSelection().removeAllRanges()
  let clearCount = 0
  const clearTimer = setInterval(() => {
    getSelection().removeAllRanges()
    if (++clearCount >= 20) clearInterval(clearTimer)
  }, 10)
}

suite('Selection Clearing', () => {
  test('clears selection immediately', () => {
    let selectionActive = true
    const mockGetSelection = () => ({
      removeAllRanges: () => {
        selectionActive = false
      },
    })

    clearTextSelection(mockGetSelection)
    assert.strictEqual(selectionActive, false, 'Selection should be cleared immediately')
  })

  test('clears selection that browser re-applies after 5ms', done => {
    let selectionActive = false
    const mockGetSelection = () => ({
      removeAllRanges: () => {
        selectionActive = false
      },
    })

    clearTextSelection(mockGetSelection)

    // Simulate browser re-applying selection after 5ms
    setTimeout(() => {
      selectionActive = true
    }, 5)

    // After 50ms, the interval should have cleared the re-applied selection
    setTimeout(() => {
      assert.strictEqual(selectionActive, false, 'Selection re-applied at 5ms should be cleared')
      done()
    }, 50)
  })

  test('clears selection that browser re-applies after 50ms', done => {
    let selectionActive = false
    const mockGetSelection = () => ({
      removeAllRanges: () => {
        selectionActive = false
      },
    })

    clearTextSelection(mockGetSelection)

    // Simulate browser re-applying selection after 50ms
    setTimeout(() => {
      selectionActive = true
    }, 50)

    // After 100ms, the interval should have cleared the re-applied selection
    setTimeout(() => {
      assert.strictEqual(selectionActive, false, 'Selection re-applied at 50ms should be cleared')
      done()
    }, 100)
  })

  test('clears selection that browser re-applies after 150ms', done => {
    let selectionActive = false
    const mockGetSelection = () => ({
      removeAllRanges: () => {
        selectionActive = false
      },
    })

    clearTextSelection(mockGetSelection)

    // Simulate browser re-applying selection after 150ms
    setTimeout(() => {
      selectionActive = true
    }, 150)

    // After 250ms, the interval should have cleared the re-applied selection
    // (20 iterations * 10ms = 200ms coverage)
    setTimeout(() => {
      assert.strictEqual(selectionActive, false, 'Selection re-applied at 150ms should be cleared')
      done()
    }, 250)
  })

  test('stops clearing after 200ms (20 intervals)', done => {
    let clearCalls = 0
    const mockGetSelection = () => ({
      removeAllRanges: () => {
        clearCalls++
      },
    })

    clearTextSelection(mockGetSelection)

    // After 300ms, all intervals should have completed
    setTimeout(() => {
      // 1 immediate call + 20 interval calls = 21 total
      assert.strictEqual(clearCalls, 21, 'Should have exactly 21 removeAllRanges calls (1 immediate + 20 interval)')
      done()
    }, 300)
  })
})
