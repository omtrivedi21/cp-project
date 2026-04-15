const id = new URLSearchParams(window.location.search).get("id");
const product = PRODUCTS.find(p => p.id == id);

let groups = JSON.parse(localStorage.getItem("groups")) || [];

let group = groups.find(g => g.productId == id);
if (!group) {
  group = { productId: id, members: [] };
  groups.push(group);
}

function joinGroup(name, phone) {
  if (group.members.length >= 5) return alert("Group full");

  group.members.push({ name, phone });

  let discount = 0;
  if (group.members.length >= 4) discount = 8;
  else if (group.members.length >= 2) discount = 5;

  localStorage.setItem("groups", JSON.stringify(groups));

  alert(`Joined! Discount: ${discount}%`);
}
