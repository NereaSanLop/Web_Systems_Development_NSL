from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    credits = Column(Integer, nullable=False, default=10)
    role_id = Column(Integer, ForeignKey("roles.id"))

    role = relationship("Role")


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    cost = Column(Integer, nullable=False)
    owner_email = Column(String, index=True, nullable=False)


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    requester_email = Column(String, index=True, nullable=False)
    provider_email = Column(String, index=True, nullable=False)
    cost = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="requested")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    service = relationship("Service")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True, nullable=False)
    counterparty_email = Column(String, index=True, nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    service_request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    direction = Column(String, nullable=False)  # debit | credit
    reason = Column(String, nullable=False, default="service_payment")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    service = relationship("Service")
    service_request = relationship("ServiceRequest")