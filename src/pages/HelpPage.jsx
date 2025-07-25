import {useState, useEffect } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import WebSocketClient from '../layout/WebSocketClient'
import { getLoginUser } from '../service/user.service'

const HelpPage = () => {
  const [loginUser, setLoginUser] = useState({
      id : 0,
      username : '',
      firstName : '',
      lastName : '',
      active : false
    });
  
    useEffect(() => {
      const fetchUser = async () => {
      const token = localStorage.getItem('token');
      const user = await getLoginUser(token);
      setLoginUser(user);
      };
  
      fetchUser();
    }, [])

    useEffect(() => {
      console.log(`Login User : ${loginUser}`)
    },[loginUser])

  return (
    <div>
        <Header />
        <h1>Help page</h1>
        <WebSocketClient currentUser={loginUser}/>
        <Footer />
    </div>
  )
}

export default HelpPage
