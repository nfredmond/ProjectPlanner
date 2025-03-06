"""A simple bank account implementation for testing."""


class InsufficientFundsError(Exception):
    """Exception raised when there are insufficient funds for a withdrawal."""
    pass


class BankAccount:
    """A simple bank account class with basic operations."""

    def __init__(self, account_number, owner_name, balance=0.0):
        """Initialize a bank account.

        Args:
            account_number: A unique account identifier
            owner_name: The name of the account owner
            balance: Initial balance, defaults to 0.0
        """
        self.account_number = account_number
        self.owner_name = owner_name
        self._balance = balance
        self._is_active = True
        self._transaction_history = []
        self._record_transaction("OPEN", balance)

    @property
    def balance(self):
        """Get the current balance."""
        return self._balance

    @property
    def is_active(self):
        """Check if the account is active."""
        return self._is_active

    @property
    def transaction_history(self):
        """Get a copy of the transaction history."""
        return self._transaction_history.copy()

    def deposit(self, amount):
        """Deposit money into the account.

        Args:
            amount: The amount to deposit

        Returns:
            The new balance

        Raises:
            ValueError: If amount is not positive
            RuntimeError: If the account is closed
        """
        if not self._is_active:
            raise RuntimeError("Cannot deposit to a closed account")

        if amount <= 0:
            raise ValueError("Deposit amount must be positive")

        self._balance += amount
        self._record_transaction("DEPOSIT", amount)
        return self._balance

    def withdraw(self, amount):
        """Withdraw money from the account.

        Args:
            amount: The amount to withdraw

        Returns:
            The new balance

        Raises:
            ValueError: If amount is not positive
            InsufficientFundsError: If there are insufficient funds
            RuntimeError: If the account is closed
        """
        if not self._is_active:
            raise RuntimeError("Cannot withdraw from a closed account")

        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")

        if amount > self._balance:
            raise InsufficientFundsError(
                f"Cannot withdraw {amount}. Current balance: {self._balance}"
            )

        self._balance -= amount
        self._record_transaction("WITHDRAW", -amount)
        return self._balance

    def close(self):
        """Close the account.

        Returns:
            The final balance

        Raises:
            RuntimeError: If the account is already closed
        """
        if not self._is_active:
            raise RuntimeError("Account is already closed")

        self._is_active = False
        self._record_transaction("CLOSE", 0)
        return self._balance

    def _record_transaction(self, transaction_type, amount):
        """Record a transaction in the history.

        Args:
            transaction_type: The type of transaction (DEPOSIT, WITHDRAW, etc.)
            amount: The amount involved in the transaction
        """
        self._transaction_history.append({
            "type": transaction_type,
            "amount": amount,
            "resulting_balance": self._balance
        })
