const memberInfo = {
    name: "User",
    phone: "9999999999",
    fullName: "User",
    mobile: "9999999999",
    pincode: "000000",
    city: "City",
    state: "State",
    country: "India",
    email: ""
};

fetch('http://localhost:3000/api/groupbuy/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteCode: "4E2CF2", memberInfo })
}).then(async res => {
    console.log(await res.text());
});
