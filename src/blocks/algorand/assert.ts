import * as Blockly from 'blockly/core'

Blockly.Blocks['assert'] = {
  init: function () {
    this.appendValueInput('condition').appendField('Assert condition:')
    this.appendValueInput('error').setCheck('String').appendField('Error:')

    this.setColour('teal')
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, 'String')
    this.setTooltip('Checks the current balance of the smart contract for specified token. If token is zero, it will return native token balance.')
    this.setHelpUrl('https://www.algorand.com')
  }
}
