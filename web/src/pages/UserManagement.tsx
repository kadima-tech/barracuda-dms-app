import { useState, useEffect } from "react";
import { Header } from "../components/common/Header";
import { Wrapper } from "../components/layout/Wrapper";
import { Banner, BannerTitle, BannerText } from "../components/common/Banner";
import {
  Card,
  CardInfo,
  Message,
  MetaInfo,
  ActionButton,
} from "../components/common/CardComponents";
import styled from "styled-components";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user";
  status: "active" | "inactive";
  lastLogin: number;
}

const UsersContainer = styled.div`
  display: grid;
  grid-gap: 2rem;
  padding: 2rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    max-width: 1400px;
    margin: 0 auto;
  }
`;

const UserCard = styled(Card)`
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid #f0f0f0;
`;

const UserStatusTag = styled.span<{ type: string }>`
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${({ type }) => {
    switch (type) {
      case "admin":
        return "background-color: #E8FFF9; color: #0CA678;";
      case "manager":
        return "background-color: #E7F1FF; color: #3B82F6;";
      case "user":
        return "background-color: #F3F4F6; color: #6B7280;";
      default:
        return "";
    }
  }}
`;

const UserName = styled(Message)`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0.75rem 0;
`;

const MetaInfoContainer = styled(MetaInfo)`
  color: #6b7280;
  font-size: 0.875rem;

  span {
    &:not(:last-child) {
      margin-right: 0.5rem;
    }

    &:nth-child(2n) {
      color: #d1d5db;
      margin: 0 0.5rem;
    }
  }
`;

const ActionButtonStyled = styled(ActionButton)`
  padding: 0.5rem 1rem;
  border-radius: 100px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f9fafb;
  }

  &.deactivate {
    color: #ef4444;
    border-color: #ef4444;

    &:hover {
      background-color: #fef2f2;
    }
  }
`;

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockUsers: User[] = [
      {
        id: "1",
        name: "John Doe",
        email: "john.doe@example.com",
        role: "admin",
        status: "active",
        lastLogin: Date.now(),
      },
      {
        id: "2",
        name: "Jane Smith",
        email: "jane.smith@example.com",
        role: "manager",
        status: "active",
        lastLogin: Date.now() - 86400000,
      },
      {
        id: "3",
        name: "Bob Johnson",
        email: "bob.johnson@example.com",
        role: "user",
        status: "active",
        lastLogin: Date.now() - 172800000,
      },
    ];
    setUsers(mockUsers);
  }, []);

  const handleEditUser = (userId: string) => {
    console.log("Edit user:", userId);
  };

  const handleDeactivateUser = (userId: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, status: "inactive" as const } : user
      )
    );
  };

  return (
    <Wrapper
      header={<Header />}
      contentBoxPrimary={[
        <Banner>
          <div>
            <BannerTitle>User Management</BannerTitle>
            <BannerText>
              Manage user accounts, roles, and permissions for your
              organization.
            </BannerText>
          </div>
        </Banner>,
        <UsersContainer>
          {users.map((user) => (
            <UserCard key={user.id} type={user.role}>
              <CardInfo>
                <UserStatusTag type={user.role}>
                  {user.role.toUpperCase()}
                </UserStatusTag>
                <UserName>{user.name}</UserName>
                <MetaInfoContainer>
                  <span>{user.email}</span>
                  <span>•</span>
                  <span>
                    Last Login: {new Date(user.lastLogin).toLocaleString()}
                  </span>
                  <span>•</span>
                  <span>Status: {user.status}</span>
                </MetaInfoContainer>
              </CardInfo>
              <div>
                <ActionButtonStyled
                  onClick={() => handleEditUser(user.id)}
                  style={{ marginRight: "0.75rem" }}
                >
                  Edit
                </ActionButtonStyled>
                {user.status === "active" && (
                  <ActionButtonStyled
                    onClick={() => handleDeactivateUser(user.id)}
                    className="deactivate"
                  >
                    Deactivate
                  </ActionButtonStyled>
                )}
              </div>
            </UserCard>
          ))}
        </UsersContainer>,
      ]}
    />
  );
};

export default UserManagement;
