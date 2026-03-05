import * as assert from 'assert'
import * as vscode from 'vscode'

suite('Extension Test Suite', () => {
  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('vfonic.ada-lightbulb'))
  })

  test('Command should be registered', async () => {
    const ext = vscode.extensions.getExtension('vfonic.ada-lightbulb')!
    await ext.activate()
    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes('ada-lightbulb.view'))
  })
})
