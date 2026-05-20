let age = 16;

if (age < 13) {
  console.log("Child");
} else if (age < 20) {
  console.log("Teenager");
} else if (age < 60) {
  console.log("Adult");
} else {
  console.log("Senior");
}


let role = "user";

switch (role) {
    case "admin":
        console.log("Full access");
        break;
    case "user":
        console.log("Limited access");
        break;
    case "guest":
        console.log("View only");
        break;
    default:
        console.log("Unknown role");
}