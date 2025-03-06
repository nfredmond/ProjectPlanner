"""Tests for the BankAccount class."""

import pytest
from python_utils.bank_account import BankAccount, InsufficientFundsError


class TestBankAccount:
    """Test class for the BankAccount class."""

    @pytest.fixture
    def account(self):
        """Fixture providing a standard bank account for testing."""
        return BankAccount("12345", "John Doe", 100.0)

    def test_init(self, account):
        """Test that a new account is initialized correctly."""
        assert account.account_number == "12345"
        assert account.owner_name == "John Doe"
        assert account.balance == 100.0
        assert account.is_active is True
        assert len(account.transaction_history) == 1
        assert account.transaction_history[0]["type"] == "OPEN"

    def test_deposit(self, account):
        """Test that deposits work correctly."""
        # Test normal deposit
        new_balance = account.deposit(50.0)
        assert new_balance == 150.0
        assert account.balance == 150.0
        assert len(account.transaction_history) == 2
        assert account.transaction_history[1]["type"] == "DEPOSIT"
        assert account.transaction_history[1]["amount"] == 50.0

        # Test deposit to exact amount
        account.deposit(0.5)
        assert account.balance == 150.5

    def test_deposit_negative_amount(self, account):
        """Test that depositing a negative amount raises ValueError."""
        with pytest.raises(ValueError):
            account.deposit(-50.0)
        
        with pytest.raises(ValueError):
            account.deposit(0)

    def test_withdraw(self, account):
        """Test that withdrawals work correctly."""
        # Test normal withdrawal
        new_balance = account.withdraw(50.0)
        assert new_balance == 50.0
        assert account.balance == 50.0
        assert len(account.transaction_history) == 2
        assert account.transaction_history[1]["type"] == "WITHDRAW"
        assert account.transaction_history[1]["amount"] == -50.0

        # Test withdrawal to zero
        account.withdraw(50.0)
        assert account.balance == 0.0

    def test_withdraw_insufficient_funds(self, account):
        """Test that withdrawing more than the balance raises InsufficientFundsError."""
        with pytest.raises(InsufficientFundsError):
            account.withdraw(150.0)

    def test_withdraw_negative_amount(self, account):
        """Test that withdrawing a negative amount raises ValueError."""
        with pytest.raises(ValueError):
            account.withdraw(-50.0)
        
        with pytest.raises(ValueError):
            account.withdraw(0)

    def test_close_account(self, account):
        """Test that closing an account works correctly."""
        final_balance = account.close()
        assert final_balance == 100.0
        assert account.is_active is False
        assert len(account.transaction_history) == 2
        assert account.transaction_history[1]["type"] == "CLOSE"

    def test_operations_on_closed_account(self, account):
        """Test that operations on a closed account raise RuntimeError."""
        account.close()
        
        with pytest.raises(RuntimeError):
            account.deposit(50.0)
            
        with pytest.raises(RuntimeError):
            account.withdraw(50.0)
            
        with pytest.raises(RuntimeError):
            account.close()

    def test_transaction_history_is_copy(self, account):
        """Test that transaction_history returns a copy of the history."""
        history = account.transaction_history
        history.append({"fake": "transaction"})
        assert len(account.transaction_history) == 1  # Original unchanged

    # Parameterized tests
    @pytest.mark.parametrize("initial_balance,deposit_amount,expected_balance", [
        (0.0, 100.0, 100.0),
        (100.0, 50.0, 150.0),
        (100.0, 0.01, 100.01),
    ])
    def test_deposit_parametrized(self, initial_balance, deposit_amount, expected_balance):
        """Test deposits with different parameters."""
        account = BankAccount("12345", "John Doe", initial_balance)
        account.deposit(deposit_amount)
        assert account.balance == expected_balance


# Example of testing both class and functions in same file
def test_create_multiple_accounts():
    """Test creating and operating on multiple accounts."""
    account1 = BankAccount("12345", "John Doe", 100.0)
    account2 = BankAccount("67890", "Jane Smith", 200.0)
    
    account1.deposit(50.0)
    account2.withdraw(50.0)
    
    assert account1.balance == 150.0
    assert account2.balance == 150.0 