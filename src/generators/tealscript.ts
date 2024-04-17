import type ITask from '@/interface/ITask'
import { javascriptGenerator as tealScriptGenerator } from 'blockly/javascript'
import YAML from 'yaml'

enum NameType {
  DEVELOPER_VARIABLE = 'DEVELOPER_VARIABLE',
  VARIABLE = 'VARIABLE',
  PROCEDURE = 'PROCEDURE'
}
interface IGeneratorState {
  vars: { [key: string]: boolean }
}
export const GeneratorState: IGeneratorState = {
  vars: {}
}
export const postProcessing = (
  code: string,
  period: number,
  start: number,
  fee: number,
  app: number
): string => {
  let tasks = '['
  for (const line of code.split('\n')) {
    if (line.trim().startsWith('{')) {
      if (tasks != '[') tasks += ','
      tasks += line
    }
  }
  tasks += ']'

  const obj = JSON.parse(tasks)
  const ret = {
    schedule: {
      period,
      start,
      fee,
      app
    },
    tasks: obj
  }

  return YAML.stringify(ret)
}
const Order = {
  ATOMIC: 0, // 0 "" ...
  NEW: 1.1, // new
  MEMBER: 1.2, // . []
  FUNCTION_CALL: 2, // ()
  INCREMENT: 3, // ++
  DECREMENT: 3, // --
  BITWISE_NOT: 4.1, // ~
  UNARY_PLUS: 4.2, // +
  UNARY_NEGATION: 4.3, // -
  LOGICAL_NOT: 4.4, // !
  TYPEOF: 4.5, // typeof
  VOID: 4.6, // void
  DELETE: 4.7, // delete
  AWAIT: 4.8, // await
  EXPONENTIATION: 5.0, // **
  MULTIPLICATION: 5.1, // *
  DIVISION: 5.2, // /
  MODULUS: 5.3, // %
  SUBTRACTION: 6.1, // -
  ADDITION: 6.2, // +
  BITWISE_SHIFT: 7, // << >> >>>
  RELATIONAL: 8, // < <= > >=
  IN: 8, // in
  INSTANCEOF: 8, // instanceof
  EQUALITY: 9, // == != === !==
  BITWISE_AND: 10, // &
  BITWISE_XOR: 11, // ^
  BITWISE_OR: 12, // |
  LOGICAL_AND: 13, // &&
  LOGICAL_OR: 14, // ||
  CONDITIONAL: 15, // ?:
  ASSIGNMENT: 16, // : += -= **= *= /= %= <<= >>= ...
  YIELD: 17, // yield
  COMMA: 18, // ,
  NONE: 99 // (...)
}
// if@v1
tealScriptGenerator.forBlock['controls_if'] = (block, generator) => {
  try {
    // If/elseif/else condition.
    let n = 0
    //let code = '';
    if (generator.STATEMENT_PREFIX) {
      // Automatic prefix insertion is switched off for this block.  Add manually.
      //code += generator.injectId(generator.STATEMENT_PREFIX, block);
    }
    const ret = {
      task: 'if@v1',
      displayName: '',
      inputs: {
        condition: '',
        ifTrue: [] as ITask[],
        ifFalse: [] as ITask[]
      }
    }
    do {
      const conditionCode = generator.valueToCode(block, 'IF' + n, Order.NONE) || 'false'
      let branchCode = generator.statementToCode(block, 'DO' + n)
      if (generator.STATEMENT_SUFFIX) {
        branchCode =
          generator.prefixLines(
            generator.injectId(generator.STATEMENT_SUFFIX, block),
            generator.INDENT
          ) + branchCode
      }
      ret.inputs.condition = conditionCode
      ret.inputs.ifTrue = [JSON.parse(branchCode)]
      // code +=
      //   (n > 0 ? ' else ' : '') +
      //   'iff (' +
      //   conditionCode +
      //   ') {\n' +
      //   branchCode +
      //   '}';
      n++
    } while (block.getInput('IF' + n))

    if (block.getInput('ELSE') || generator.STATEMENT_SUFFIX) {
      let branchCode = generator.statementToCode(block, 'ELSE')
      if (generator.STATEMENT_SUFFIX) {
        branchCode =
          generator.prefixLines(
            generator.injectId(generator.STATEMENT_SUFFIX, block),
            generator.INDENT
          ) + branchCode
      }
      //code += ' else {\n' + branchCode + '}';
      ret.inputs.ifFalse = [JSON.parse(branchCode)]
    }
    return JSON.stringify(ret) + '\n'
  } catch (e) {
    console.error(e)
    return ''
  }
}

tealScriptGenerator.getVariableName = (nameOrId) => {
  return tealScriptGenerator.nameDB_?.getName(nameOrId, NameType.VARIABLE) ?? ''
}

// var@v1 | math@v1
tealScriptGenerator.forBlock['variables_set'] = (block, generator) => {
  try {
    const ret = {
      task: 'var@v1',
      displayName: '',
      inputs: {} as any
    }
    // Variable setter.
    const argument0 = generator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0'
    const varName = generator.getVariableName(block.getFieldValue('VAR'))

    if (GeneratorState.vars[varName] === undefined) {
      ret.task = 'var@v1'
      ret.inputs = {
        var: varName,
        type: '',
        defaultValue: argument0
      }
      GeneratorState.vars[varName] = true
    } else {
      ret.task = 'math@v1'
      ret.inputs = {
        var: varName,
        formula: argument0
      }
    }

    return JSON.stringify(ret) + '\n'
  } catch (e) {
    console.error(e)
    return ''
  }
}

// folks-oracle@v1
tealScriptGenerator.forBlock['folks_oracle'] = (block, generator) => {
  try {
    // Variable setter.
    const argumentContract = generator.valueToCode(block, 'contract', Order.ASSIGNMENT) || '0'
    const argumentToken = generator.valueToCode(block, 'token', Order.ASSIGNMENT) || '0'
    const argumentVar = generator.valueToCode(block, 'var', Order.ASSIGNMENT) || '0'
    const ret = {
      task: 'folks-oracle@v1',
      displayName: `Fetch oracle price and store to ${argumentVar}`,
      inputs: {
        var: '',
        contract: '',
        token: ''
      }
    }
    // const varName = generator.getVariableName(block.getFieldValue('var'))

    //const varName = '1';
    ret.inputs.var = argumentVar
    ret.inputs.contract = argumentContract
    ret.inputs.token = argumentToken

    return JSON.stringify(ret) + '\n'
  } catch (e) {
    console.error(e)
    return ''
  }
}

// pay@v1
tealScriptGenerator.forBlock['pay'] = (block, generator) => {
  try {
    // Variable setter.
    const argumentAmount = generator.valueToCode(block, 'amount', Order.ASSIGNMENT) || '0'
    const argumentToken = generator.valueToCode(block, 'token', Order.ASSIGNMENT) || '0'
    const argumentReceiver = generator.valueToCode(block, 'receiver', Order.ASSIGNMENT) || '0'

    const ret = {
      task: 'pay@v1',
      displayName: `Pay to ${argumentReceiver} ${argumentAmount} of token ${argumentToken}`,
      inputs: {
        receiver: '',
        amount: '',
        token: ''
      }
    }
    // const varName = generator.getVariableName(block.getFieldValue('var'))

    //const varName = '1';
    ret.inputs.receiver = argumentReceiver
    ret.inputs.amount = argumentAmount
    ret.inputs.token = argumentToken

    return JSON.stringify(ret) + '\n'
  } catch (e) {
    console.error(e)
    return ''
  }
}
// pay@v1
tealScriptGenerator.forBlock['sc_balance'] = (block, generator) => {
  try {
    // Variable setter.
    const argumentToken = generator.valueToCode(block, 'token', Order.ASSIGNMENT) || '0'
    const argumentVar = generator.valueToCode(block, 'var', Order.ASSIGNMENT) || '0'
    // const varName = generator.getVariableName(block.getFieldValue('var'))

    return (
      JSON.stringify({
        task: 'sc-balance@v1',
        displayName: `Store escrow balance of token ${argumentToken} to variable ${argumentVar}`,
        inputs: {
          var: argumentVar,
          token: argumentToken
        }
      }) + '\n'
    )
  } catch (e) {
    console.error(e)
    return ''
  }
}

// assert@v1
tealScriptGenerator.forBlock['assert'] = (block, generator) => {
  try {
    // Variable setter.
    const conditionCode = generator.valueToCode(block, 'condition', Order.NONE) || 'false'
    const argumentError = generator.valueToCode(block, 'error', Order.ASSIGNMENT) || '0'

    return (
      JSON.stringify({
        task: 'assert@v1',
        displayName: `Assert ${argumentError}`,
        inputs: {
          condition: conditionCode,
          error: argumentError
        }
      }) + '\n'
    )
  } catch (e) {
    console.error(e)
    return ''
  }
}

// pact-swap@v1
tealScriptGenerator.forBlock['pact_swap'] = (block, generator) => {
  try {
    // Variable setter.
    const argumentContract = generator.valueToCode(block, 'contract', Order.ASSIGNMENT) || '0'
    const argumentToken = generator.valueToCode(block, 'token', Order.ASSIGNMENT) || '0'
    const argumentAmount = generator.valueToCode(block, 'amount', Order.ASSIGNMENT) || '0'
    const argumentMinAssetB = generator.valueToCode(block, 'minAssetB', Order.ASSIGNMENT) || '0'

    return (
      JSON.stringify({
        task: 'pact-swap@v1',
        displayName: `Swap at pact pool ${argumentContract}`,
        inputs: {
          contract: argumentContract,
          token: argumentToken,
          amount: argumentAmount,
          minAssetB: argumentMinAssetB
        }
      }) + '\n'
    )
  } catch (e) {
    console.error(e)
    return ''
  }
}

export { tealScriptGenerator }
