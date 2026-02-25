import HeroSection from "@/components/public/HeroSection"
import CoursePackagesSection from "@/components/public/CoursePackagesSection"
import FacultySection from "@/components/public/FacultySection"
import TopStudentsSection from "@/components/public/TopStudentsSection"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <CoursePackagesSection />
      <FacultySection />
      <TopStudentsSection />
    </div>
  )
}
