import React from "react";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>&copy; {new Date().getFullYear()} LendLoop</p>
      </div>
    </footer>
  );
};

export default Footer;
