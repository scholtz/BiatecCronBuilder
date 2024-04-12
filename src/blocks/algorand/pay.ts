import * as Blockly from 'blockly/core'

Blockly.Blocks['pay'] = {
  init: function () {
    this.appendValueInput('receiver').setCheck('String').appendField('Pay to receiver:')
    this.appendValueInput('token').setCheck('Number').appendField('Asset Id:')
    this.appendValueInput('amount').setCheck('Number').appendField('Amount:')

    this.appendDummyInput()
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, 'String')
    this.setColour('teal')
    this.setTooltip('Do native asset or token payment from smart contract to receiver.')
    this.setHelpUrl('https://www.algorand.com')
  }
}
