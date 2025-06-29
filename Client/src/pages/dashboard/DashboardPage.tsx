import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../../components/common/Layout';
import Dashboard from '../../components/dashboard/Dashboard';
import { fetchUser, RootState } from '../../store';

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    // On mount, if token exists in localStorage but Redux user is null, fetch user
    const token = localStorage.getItem('token');
    if (token && !user) {
      dispatch<any>(fetchUser());
    }
  }, [dispatch, user]);

  return (
    <Layout showFooter={false}>
      <Dashboard />
    </Layout>
  );
};

export default DashboardPage;