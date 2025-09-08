'use client';

import Image from "next/image";
import { useRef } from "react";
import { jsPDF } from "jspdf";
import { useCertInfoStore } from "@/Store/certStore";
import { toPng } from "html-to-image";

const Certificate = () => {
  const certificateRef = useRef();
  const { certInfo } = useCertInfoStore();
  
  // credentialSubject에서 데이터 추출
  const credentialSubject = certInfo?.vc?.credentialSubject || {};
  
  // 발급일은 다른 위치에서 가져오기
  const issueDate = credentialSubject.issueDate || 
    certInfo?.payload?.issuseDate || 
    certInfo?.payload?.issuanceDate ||
    certInfo?.verifiableCredential?.issuanceDate;
  
  const date = Number(Date.now().toString().slice(-6));

  // 표시할 필드들 정의 (순서대로)
  const certificateFields = [
    {
      key: 'userId',
      label: '사용자 DID',
      value: credentialSubject.userId,
      className: 'font-mono break-all'
    },
    {
      key: 'certificateName',
      label: '수료증 이름',
      value: credentialSubject.certificateName,
      className: 'break-words'
    },
    {
      key: 'issuerId',
      label: '발급자 DID',
      value: credentialSubject.issuerId,
      className: 'font-mono break-all'
    },
    {
      key: 'issueDate',
      label: '발급 날짜',
      value: issueDate,
      className: ''
    }
  ];

  // PDF 다운로드 핸들러 함수
  const handleDownloadPdf = async () => {
    if (!certificateRef.current) return;

    const imgData = await toPng(certificateRef.current, { cacheBust: true });

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Get image properties
    const imgProps = pdf.getImageProperties(imgData);
    let imgWidth = pdfWidth;
    let imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    // If image is taller than page, fit by height instead
    if (imgHeight > pdfHeight) {
      imgHeight = pdfHeight;
      imgWidth = (imgProps.width * imgHeight) / imgProps.height;
    }

    // Center the image
    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;

    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    pdf.save("certificate.pdf");
  };

  return (
    <div className="font-noto-serif min-h-screen p-4 px-6 sm:p-8 sm:px-12">
      <div className="max-w-4xl mx-auto mt-20 sm:mt-15">
        <div className="absolute top-4 right-4 sm:top-10 sm:right-10 cursor-pointer p-2 rounded-md hover:bg-black/5 active:scale-[0.98] transition" onClick={handleDownloadPdf}>
          <Image src="/download.png" alt="download" width={30} height={50}></Image>
        </div>
        
        <div ref={certificateRef} className="bg-white rounded-lg p-4 px-6 sm:p-9 sm:px-16 backdrop-blur-sm shadow-blue-500/20 min-h-[480px] sm:min-h-[550px] overflow-hidden">
          {/* Certificate Header */}
          <h1 className="text-2xl sm:text-4xl font-semibold mb-6 sm:mb-8 w-fit mx-auto">수 료 증</h1>

          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <h2 className="text-lg sm:text-2xl font-semibold">
              경일 게임IT 아카데미
            </h2>
            <Image src="/jungbu.png" alt="jungbu" width={60} height={60} className="sm:w-[80px] sm:h-[80px]" />
            <div className="text-sm sm:text-base w-auto sm:w-[211px] flex justify-end">제: 2025-{date} 호</div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex flex-col items-center lg:items-start">
              <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-full border-2 border-gray-300 mb-6 sm:mb-8 overflow-hidden bg-gradient-to-br flex items-center justify-center">
                <img
                  src={credentialSubject.ImagePath}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 break-words">
                이름 : {credentialSubject.userName || '홍길동'}
              </h3>
              <h4 className="text-base sm:text-xl">{credentialSubject.DOB}</h4>
            </div>
            
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              <div className="gap-2 border-b-1 border-gray-300 pb-3 sm:pb-4 space-y-2">
                {certificateFields.map((field, i) => (
                  <div key={field.key || i}>
                    <label className="text-sm sm:text-md font-bold">{field.label}</label>
                    <p className={field.className}>{field.value || 'N/A'}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 sm:mt-4 space-y-2 text-sm sm:text-md">
                <div className="flex justify-between">
                  <span className="font-bold">검증 결과:</span>
                  <span className="text-green-500 font-bold">검증 완료</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 py-4 w-full sm:w-150 mx-auto rounded-lg px-1">
            <p className="leading-relaxed text-base sm:text-2xl font-noto-serif font-bold text-center">
              위 사람은 경일 게임IT 아카데미에서 {credentialSubject.certificateName} 과정을 수료하였으므로 이 증서를 수여합니다.
            </p>
          </div>
          
          <div className="mt-8 h-15 flex justify-center md:justify-end items-center">
            <Image src="/stamp.png" alt="certificate" width={70} height={0} className="sm:w-[80px]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;