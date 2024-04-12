import * as Blockly from 'blockly/core'

Blockly.Blocks['folks_oracle'] = {
  init: function () {
    this.appendValueInput('contract').setCheck('Number').appendField('Oracle contract Id:')
    this.appendValueInput('token').setCheck('Number').appendField('Asset Id:')
    this.appendValueInput('var').appendField('Save result to variable')

    this.appendDummyInput()
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, 'String')
    this.setColour('blue')
    this.setTooltip('Fetch the current folks oracle price and stores it to variable')
    this.setHelpUrl('https://folks.finance')
  }
}
