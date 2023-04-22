import axios from 'axios';
import {Notification} from 'element-ui'
const API_URL = 'http://127.0.0.1:8899/api';
const config={
  baseURL: API_URL,
  headers: {'Content-Type': 'application/json;charset=UTF-8'},
}
const axiosInstance = axios.create(config);

const notifyError=(message)=>{
  Notification({
    title: "请求错误",
    message: message,
    type: "error"
  })
}
const handleResponse = (response,fun) => {
  if(response.data.status!==undefined&&response.data.status!==200){
    notifyError(response.data.message)
  }else{
    fun(response.data)
  }
}

const handleError = (error) => {
  if (error.response) {
    // 请求已经发送，服务器返回错误响应
    notifyError(error.response.data)
    /*console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);*/
    notifyError("服务器错误");
  } else if (error.request) {
    // 请求已经发送但是没有接收到响应
    //console.log(error.request);
    notifyError("请求已经发送但是没有接收到响应");
  } else {
    // 在设置请求时发生了一些事情，触发了错误
    //console.log('Error', error.message);
    notifyError("发生错误");
  }
  /*console.log(error.config);
  throw error;*/
};

const api = {
  setAuthorizationHeader(token) {
    axiosInstance.defaults.headers.Authorization = `Bearer ${token}`;
  },
  setContentTypeHeader(contentType) {
    axiosInstance.defaults.headers['Content-Type'] = contentType;
  },
  param(){
    this.setContentTypeHeader("form-data");
    return this;
  },
  json(){
    this.setContentTypeHeader("application/json;charset=UTF-8");
    return this;
  },
  file(){
this.setContentTypeHeader("multipart/form-data");
    return this;
  },
  async request(method, url, data = {}, params = {},fun) {
    try {
      const config = {
        method,
        url,
        params,
        data,
      };
      const response = await axiosInstance(config);
      return handleResponse(response,fun);
    } catch (error) {
      return handleError(error);
    }
  },
  async get(url, params = {},fun=function (){}) {
    this.param();
    return this.request('get', url, null, params,fun);
  },
  async post(url, data, params = {},fun=function (){}) {
    this.json();
    return this.request('post', url, data, params,fun);
  },
  async postParams(url, params = {},fun=function (){}) {
    this.param()
    let paramst = new FormData();
    for (let key in params) {
      paramst.append(key, params[key]);
    }
    return this.request('post', url,paramst,undefined,fun);
  },
  async postBody(url, data={},fun=function (){}) {
    this.json()
    return this.request('post', url,data, undefined,fun);
  },
  async put(url, data = {}, params = {},fun=function (){}) {
    return this.request('put', url, data, params,fun);
  },
  async patch(url, data = {}, params = {},fun=function (){}) {
    return this.request('patch', url, data, params,fun);
  },
  async delete(url, params = {},fun=function (){}) {
    return this.request('delete', url, null, params,fun);
  },
};

export default api
