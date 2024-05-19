---
layout: post
title: Closures - Private Variables and Methods in JavaScript
city: London, UK 🇬🇧
---
Some languages such as Java allow us to declare methods and variables in a class
as private, restraining anything outside the class itself to access them.

This is very important to achieve encapsulation and conform to the best
practices of object oriented programming. Making a variable private also allows
the function to have total control over how it is manipulated.

JavaScript, however, does not allow you to specify whether variables and methods
of an object should be private or public in their declaration, but it does
give us a way to implement them as such.

Give a look at the following code:

``` javascript
var myBankAccount = (function(){
  var balance = 0;

  return{
    getBalance: function(){
      return balance
    }
  }
})()
```

Here we are declaring a variable, `myBankAccount`, and assigning something to it.
In the other sign of the assignment we are then declaring a function, but notice
that this function declaration is within brackets and at the end, in the last
line, there is a `()`. This means that we are invoking this function that we just
declared. So, `myBankAccount` is not being assigned the function, but because the
function is being called `myBankAccount` is being assigned the return value of
the function.

The return value of that function is an object with one property, `getBalance`.
But this object is very interesting
because unlike anything outside the function it has access to the
balance variable, which only exists inside the function. Even though the function
has returned already, because the returned object still references variables of
the function, these variables become long lived and will not
be destroyed. We can get the balance by executing `myBankAccount.getBalance()`.


This way we have actually created an object with a private property. This is
called a **closure**.

Let's make it more interesting and add a couple more things.

``` javascript
var bankAccount = function(initialBalance){
  // Let's initialise the balance with the value passed as an argument
  // to the function.

  var balance = initialBalance;

  return {
    getBalance: function(){
      return balance
    },
    deposit: function(amount){
      // Let's add the amount to what we already have in the
      //  balance.
      balance += amount;
      // Return the new balance
      return balance;
    },
    withdraw: function(amount){
      // Check if we have enough money to withdraw all that.
      if(amount <= balance){
        balance -= amount;
        return true;
      }
      else{
        return false;
      }
    }
  }
}

var marceloAccount = bankAccount(100);

marceloAccount.deposit(10) // 110
marceloAccount.withdraw(80) // true
marceloAccount.withdraw(80) // false
```

Here we did a couple of things differently. Now we are not declaring an anonymous
function and calling it straight away, we are assigning the function to a variable
and only then we invoke the function variable to create an instance of the bank
account, which we assign to `marceloAccount`. `bankAccount` returns an object with
three properties: `getBalance`, which gives us the current balance; `deposit`,
which adds to our balance; and `withdraw`, which takes money from the balance.

That's where closures really shine. Here we were able to use a private
variable to ensure that the balance would never be negative.

Closures are an excellent way to keep things tidy and working properly. With
closures we can build code that is more secure and more robust as we are
controlling how things are being changed. We can also build things that are easier
to test and debug, as we know exactly what has access to what, as well as easier
to reuse.
