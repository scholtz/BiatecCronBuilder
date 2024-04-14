import * as Blockly from 'blockly/core'

Blockly.Blocks['sc_balance'] = {
  init: function () {
    this.appendValueInput('token').setCheck('Number').appendField('Escrow account balance of asset id:')
    this.appendValueInput('var').appendField('Save result to variable')
    this.appendDummyInput()
    this.setColour('teal')
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, 'String')
    this.setTooltip('Checks the current balance of the smart contract for specified token. If token is zero, it will return native token balance.')
    this.setHelpUrl('https://www.algorand.com')
  }
}
