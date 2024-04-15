import * as Blockly from 'blockly/core'

Blockly.Blocks['pact_swap'] = {
  init: function () {
    this.appendValueInput('contract').setCheck('Number').appendField('Execute SWAP at Pool Id:')
    this.appendValueInput('token').setCheck('Number').appendField('Input asset Id:')
    this.appendValueInput('amount').setCheck('Number').appendField('Input amount:')
    this.appendValueInput('minAssetB').setCheck('Number').appendField('Minimum received:')
    this.appendDummyInput()

    this.setPreviousStatement(true, null)
    this.setNextStatement(true, 'String')
    this.setColour('#7b5804')
    this.setTooltip('Swap asset to other asset using single pact pool')
    this.setHelpUrl('https://pact.fi')
  }
}
