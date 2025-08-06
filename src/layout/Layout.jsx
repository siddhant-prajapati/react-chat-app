import React from 'react';
import Header from '../components/Header';

const Layout = ({ children, loginUser, onFriendAdded }) => (
  <div>
    <Header 
      loginUser={loginUser}
      onFriendAdded={onFriendAdded}
    />
    {children}
  </div>
);

export default Layout;