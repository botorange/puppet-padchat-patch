import axios from 'axios'
import { AUTH_ENDPOINT } from './config'

export interface CheckDataResponse {
  qrcodeUrl?: string,
  data?: string,
  status: 'waiting' | 'done' | 'new'
}

export class Gateway {
  public async getAuthData(wxid: string): Promise<CheckDataResponse> {
    const res = await axios.get(`${AUTH_ENDPOINT}/checkData/${wxid}`)
    const data: CheckDataResponse = res.data
    return data
  }
}
