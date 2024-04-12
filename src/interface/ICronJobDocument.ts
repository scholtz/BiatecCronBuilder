import type ITask from './ITask'

export default interface ICronJobDocument {
  schedule: {
    period: number
    start: number
  }
  tasks: ITask[]
}
