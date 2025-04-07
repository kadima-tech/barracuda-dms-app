// import styled from "styled-components";

// const SectionContainer = styled.div`
//   padding: 1.5rem;
//   max-width: 1200px;
//   margin: 0 auto;
// `;

// const SectionTitle = styled.h2`
//   text-align: center;
//   color: #4a5568;
//   font-size: 2rem;
//   margin-bottom: 2rem;
//   font-weight: 600;

//   &:after {
//     content: "";
//     display: block;
//     width: 40px;
//     height: 2px;
//     background: #0cbab1;
//     margin: 0.75rem auto 0;
//   }
// `;

// const FeaturesGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(3, 1fr);
//   gap: 1.5rem;
//   margin-top: 1.5rem;
// `;

// const FeatureCard = styled.div`
//   background: white;
//   border-radius: 12px;
//   overflow: hidden;
//   transition: transform 0.3s ease, box-shadow 0.3s ease;
//   cursor: pointer;

//   &:hover {
//     transform: translateY(-4px);
//     box-shadow: 0 8px 16px rgba(12, 186, 177, 0.12);
//   }
// `;

// const FeatureImage = styled.div`
//   background: linear-gradient(135deg, #0cbab1 0%, #098f88 100%);
//   height: 200px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   padding: 2rem;
//   position: relative;
//   overflow: hidden;

//   &:after {
//     content: "";
//     position: absolute;
//     top: 0;
//     left: 0;
//     right: 0;
//     bottom: 0;
//     background: radial-gradient(
//       circle at center,
//       rgba(255, 255, 255, 0.1) 0%,
//       transparent 70%
//     );
//   }

//   span {
//     transition: transform 0.3s ease;
//   }

//   &:hover span {
//     transform: scale(1.1) rotate(5deg);
//   }
// `;

// const FeatureContent = styled.div`
//   padding: 2rem;
//   background: #f8f9ff;
//   border-top: 3px solid rgba(12, 186, 177, 0.1);
// `;

// const FeatureTitle = styled.h3`
//   color: #0cbab1;
//   font-size: 1.125rem;
//   margin: 0 0 1rem 0;
//   text-align: center;
//   font-weight: 600;
//   position: relative;
//   display: inline-block;
//   width: 100%;
// `;

// const FeatureDescription = styled.p`
//   color: #4a5568;
//   text-align: center;
//   line-height: 1.6;
//   font-size: 0.875rem;
//   margin: 0;
// `;

// const FeaturesSection = () => {
//   const features = [
//     {
//       title: "Device Management",
//       description:
//         "Centralized control panel for managing all your connected devices. Monitor status, performance, and make real-time adjustments.",
//       icon: "🖥️", // Replace with actual icon/image
//     },
//     {
//       title: "Content Distribution",
//       description:
//         "Efficiently distribute and update content across all your devices. Schedule updates and manage content deployment with ease.",
//       icon: "🔄", // Replace with actual icon/image
//     },
//     {
//       title: "Performance Analytics",
//       description:
//         "Track device performance metrics and get insights into system health, uptime, and content delivery effectiveness.",
//       icon: "📊", // Replace with actual icon/image
//     },
//   ];

//   return (
//     <SectionContainer>
//       <SectionTitle>Platform Features</SectionTitle>
//       <FeaturesGrid>
//         {features.map((feature, index) => (
//           <FeatureCard key={index}>
//             <FeatureImage>
//               <span style={{ fontSize: "3rem" }}>{feature.icon}</span>
//             </FeatureImage>
//             <FeatureContent>
//               <FeatureTitle>{feature.title}</FeatureTitle>
//               <FeatureDescription>{feature.description}</FeatureDescription>
//             </FeatureContent>
//           </FeatureCard>
//         ))}
//       </FeaturesGrid>
//     </SectionContainer>
//   );
// };

// export default FeaturesSection;
