import * as Blockly from 'blockly/core'

Blockly.Blocks['pact_swap'] = {
  init: function () {
    this.appendValueInput('contract').setCheck('Number').appendField('Execute SWAP at Pool Id:')
    this.appendValueInput('sendToken').setCheck('Number').appendField('Send asset id:')
    this.appendValueInput('sendAmount').setCheck('Number').appendField('Send amount:')
    this.appendValueInput('receiveToken').setCheck('Number').appendField('Receive asset id:')
    this.appendValueInput('receiveAmountMin').setCheck('Number').appendField('Minimum received:')
    this.appendDummyInput()

    this.setPreviousStatement(true, null)
    this.setNextStatement(true, 'String')
    this.setColour('#7b5804')
    this.setTooltip('Swap asset to other asset using single pact pool')
    this.setHelpUrl('https://pact.fi')
  }
}
